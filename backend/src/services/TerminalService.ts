import { spawn, exec, ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
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
    cwd: string = process.env.HOME || "C:\\",
    name: string = "Terminal"
  ): void {
    const existing = this.sessions.get(sessionId);
    if (existing && existing.process && !existing.process.killed && existing.process.exitCode === null) {
      socket.emit(
        `terminal:output:${sessionId}`,
        `\r\n\x1b[32m[Terhubung ke sesi aktif: ${existing.name}]\x1b[0m\r\n$ `
      );
      return;
    }

    if (existing) {
      this.closeSession(sessionId);
    }

    const isWindows = process.platform === "win32";
    const shell = isWindows ? (process.env.COMSPEC || "cmd.exe") : "/bin/bash";
    const args = isWindows ? [] : ["--norc", "--noprofile", "-i"];

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

  public static writeInput(io: Server, sessionId: string, input: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.process && session.process.stdin.writable) {
      const normalizedInput = input.replace(/\r/g, "\n");
      session.process.stdin.write(normalizedInput);

      if (input === "\r" || input === "\n") {
        io.emit(`terminal:output:${sessionId}`, "\r\n");
      } else if (input === "\x7f" || input === "\b") {
        io.emit(`terminal:output:${sessionId}`, "\b \b");
      } else {
        io.emit(`terminal:output:${sessionId}`, input);
      }
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

  public static async executeCommand(
    cwd: string,
    command: string,
    timeoutMs: number = 30000
  ): Promise<{ stdout: string; stderr: string; exitCode: number; success: boolean }> {
    return new Promise((resolve) => {
      let validCwd = cwd;
      if (!cwd || !fs.existsSync(cwd)) {
        validCwd = process.cwd();
      }

      const options = {
        cwd: validCwd,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024 * 5,
        env: { ...process.env },
      };

      exec(command, options, (error, stdout, stderr) => {
        const outStr = (stdout || "").toString();
        const errStr = (stderr || "").toString();
        const exitCode = error && typeof error.code === "number" ? error.code : (error ? 1 : 0);
        resolve({
          stdout: outStr,
          stderr: errStr || (error ? error.message : ""),
          exitCode,
          success: exitCode === 0,
        });
      });
    });
  }
}
