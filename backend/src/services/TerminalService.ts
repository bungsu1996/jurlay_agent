import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { Server, Socket } from "socket.io";

interface TerminalSession {
  id: string;
  process: ChildProcessWithoutNullStreams;
  name: string;
  cwd: string;
}

export class TerminalService {
  private static sessions: Map<string, TerminalSession> = new Map();

  public static createSession(
    io: Server,
    socket: Socket,
    sessionId: string,
    cwd: string = process.env.HOME || "/Users/apple",
    name: string = "Terminal"
  ): void {
    const existing = this.sessions.get(sessionId);
    if (existing && existing.process && !existing.process.killed && existing.process.exitCode === null) {
      // Re-attach to active session
      socket.emit(
        `terminal:output:${sessionId}`,
        `\r\n\x1b[32m[Terhubung ke sesi aktif: ${existing.name}]\x1b[0m\r\n$ `
      );
      return;
    }

    if (existing) {
      this.closeSession(sessionId);
    }

    // Default terminal based on OS
    const isWindows = process.platform === "win32";
    const shell = isWindows ? (process.env.COMSPEC || "cmd.exe") : "/bin/bash";
    const args = isWindows ? [] : ["--norc", "--noprofile", "-i"];

    // Clean env to avoid NVM & npm_config_prefix conflict
    const sanitizedEnv = {
      ...process.env,
      TERM: "xterm-256color",
      BASH_SILENCE_DEPRECATION_WARNING: "1",
    };
    delete (sanitizedEnv as any).npm_config_prefix;
    delete (sanitizedEnv as any).NPM_CONFIG_PREFIX;

    const child = spawn(shell, args, {
      cwd,
      env: sanitizedEnv,
    });

    const session: TerminalSession = {
      id: sessionId,
      process: child,
      name,
      cwd,
    };

    this.sessions.set(sessionId, session);

    child.stdout.on("data", (data: Buffer) => {
      io.emit(`terminal:output:${sessionId}`, data.toString("utf-8"));
    });

    child.stderr.on("data", (data: Buffer) => {
      io.emit(`terminal:output:${sessionId}`, data.toString("utf-8"));
    });

    child.on("close", (code) => {
      io.emit(
        `terminal:output:${sessionId}`,
        `\r\n\x1b[31m[Proses berakhir dengan kode ${code}]\x1b[0m\r\n`
      );
      this.sessions.delete(sessionId);
    });

    child.on("error", (err) => {
      io.emit(
        `terminal:output:${sessionId}`,
        `\r\n\x1b[31m[Kesalahan terminal: ${err.message}]\x1b[0m\r\n`
      );
    });

    socket.emit(
      `terminal:output:${sessionId}`,
      `\x1b[1;31m⚡ JURLAY AGENT Terminal [${name}] Aktif (${shell})\x1b[0m\r\n`
    );
  }

  public static writeInput(sessionId: string, input: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.process && session.process.stdin.writable) {
      // Normalisasi carriage return (\r) ke newline (\n) agar input dieksekusi oleh shell piped
      const normalizedInput = input.replace(/\r/g, "\n");
      session.process.stdin.write(normalizedInput);
    }
  }

  public static closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        session.process.kill();
      } catch (e) {
        // ignore
      }
      this.sessions.delete(sessionId);
    }
  }

  public static listSessions(): { id: string; name: string; cwd: string }[] {
    return Array.from(this.sessions.values()).map((s) => ({
      id: s.id,
      name: s.name,
      cwd: s.cwd,
    }));
  }
}
