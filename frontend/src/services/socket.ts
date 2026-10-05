import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io("/", {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 10,
    });

    socketInstance.on("connect", () => {
      console.log("⚡ Connected to JURLAY AGENT Socket Server ID:", socketInstance?.id);
    });

    socketInstance.on("disconnect", () => {
      console.log("🔌 Disconnected from Socket Server");
    });
  }

  return socketInstance;
}
