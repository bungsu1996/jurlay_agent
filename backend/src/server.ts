import "reflect-metadata";
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { AppDataSource } from "./config/database";
import { runSeed } from "./config/seed";
import apiRoutes from "./routes/api";
import { setupSocketHandlers } from "./sockets/socketHandler";

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5001;

// CORS setup
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));

app.use(express.json());

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

// Mount API routes
app.use("/api", apiRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    company: "JURLAY AGENT",
    timestamp: new Date().toISOString(),
  });
});

// Setup sockets
setupSocketHandlers(io);

// Start server after DB init
async function bootstrap() {
  try {
    console.log("Connecting to MySQL Database...");
    await AppDataSource.initialize();
    console.log("Database connected successfully!");

    // Run seed
    await runSeed();

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 JURLAY AGENT Backend is running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
      console.log(`Health:  http://localhost:${PORT}/health`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error("Failed to start backend server:", err);
    process.exit(1);
  }
}

bootstrap();
