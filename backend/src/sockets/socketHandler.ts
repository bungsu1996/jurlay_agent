import { Server, Socket } from "socket.io";
import { TerminalService } from "../services/TerminalService";

export function setupSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    // Terminal handling
    socket.on("terminal:init", (data: { sessionId: string; cwd?: string; name?: string }) => {
      const { sessionId, cwd, name } = data;
      TerminalService.createSession(io, socket, sessionId, cwd, name);
    });

    socket.on("terminal:input", (data: { sessionId: string; input: string }) => {
      TerminalService.writeInput(io, data.sessionId, data.input);
    });

    socket.on("terminal:close", (data: { sessionId: string }) => {
      TerminalService.closeSession(data.sessionId);
    });

    // Room joins
    socket.on("join:task", (taskId: string) => {
      socket.join(`task:${taskId}`);
    });

    socket.on("leave:task", (taskId: string) => {
      socket.leave(`task:${taskId}`);
    });

    socket.on("join:meeting", (meetingId: string) => {
      socket.join(`meeting:${meetingId}`);
    });

    socket.on("leave:meeting", (meetingId: string) => {
      socket.leave(`meeting:${meetingId}`);
    });

    socket.on("disconnect", () => {
      // client disconnected
    });
  });
}
