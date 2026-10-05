import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Employee } from "../entities/Employee";
import { GithubProject } from "../entities/GithubProject";
import { Task } from "../entities/Task";
import { SubTask } from "../entities/SubTask";
import { Meeting } from "../entities/Meeting";
import { MeetingMessage } from "../entities/MeetingMessage";
import { TaskLog } from "../entities/TaskLog";
import { DirectMessage } from "../entities/DirectMessage";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "jurlay_agent_db",
  synchronize: true, // Auto synchronize entities to tables in dev
  logging: false,
  entities: [
    Employee,
    GithubProject,
    Task,
    SubTask,
    Meeting,
    MeetingMessage,
    TaskLog,
    DirectMessage,
  ],
  extra: {
    connectionLimit: 10,
  }
});
