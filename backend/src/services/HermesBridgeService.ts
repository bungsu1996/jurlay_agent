import fs from "fs";
import path from "path";
import os from "os";
import { exec, spawn } from "child_process";

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export class HermesBridgeService {
  private static profilesDir = path.join(os.homedir(), ".hermes", "profiles");

  /**
   * Sanitizes dirty directory path strings (e.g., stripping stack traces like TypeORMError.ts:7:9)
   */
  public static sanitizePath(rawPath?: string): string {
    if (!rawPath) return process.cwd();

    // Take first line only and remove parenthesis stack trace hints
    let cleaned = rawPath.split("\n")[0].split("(")[0].trim();
    cleaned = cleaned.replace(/^[":'\s]+|[":'\s]+$/g, "");

    // If it points to a file, take its directory
    if (fs.existsSync(cleaned)) {
      const stat = fs.statSync(cleaned);
      if (stat.isFile()) {
        return path.dirname(cleaned);
      }
      return cleaned;
    }

    // Attempt parent directory lookup if nested path doesn't exist yet
    let current = cleaned;
    while (current && current !== path.parse(current).root) {
      if (fs.existsSync(current) && fs.statSync(current).isDirectory()) {
        return current;
      }
      current = path.dirname(current);
    }

    return process.cwd();
  }

  /**
   * Finds the path to the Hermes CLI executable on Windows/POSIX
   */
  public static getHermesCliPath(): string {
    const isWindows = process.platform === "win32";
    const candidates = [
      path.join(process.env.LOCALAPPDATA || "", "hermes", "hermes-agent", ".hermes", "bin", isWindows ? "hermes.cmd" : "hermes"),
      path.join(process.env.LOCALAPPDATA || "", "hermes", "hermes-agent", ".hermes", "bin", isWindows ? "hermes.exe" : "hermes"),
      path.join(process.env.HOME || os.homedir(), ".local", "bin", "hermes"),
      path.join(process.env.APPDATA || "", "npm", isWindows ? "hermes.cmd" : "hermes"),
    ];

    for (const p of candidates) {
      if (p && fs.existsSync(p)) return p;
    }

    return isWindows ? "hermes.cmd" : "hermes";
  }

  /**
   * Ensures a Hermes Agent profile exists with the employee's system prompt and allowed tools
   */
  public static ensureProfile(profileName: string, systemPrompt: string, allowedTools: string[] = []): string {
    const profilePath = path.join(this.profilesDir, profileName);
    if (!fs.existsSync(profilePath)) {
      fs.mkdirSync(profilePath, { recursive: true });
    }

    const configPath = path.join(profilePath, "config.yaml");
    const yamlContent = `# Profile: ${profileName} - JURLAY AGENT
system_prompt: |
  ${systemPrompt.replace(/\n/g, "\n  ")}
tools:
  allowed: [${allowedTools.map((t) => `"${t}"`).join(", ")}]
`;
    fs.writeFileSync(configPath, yamlContent.trim(), "utf-8");
    return profilePath;
  }

  /**
   * Safely executes a command using non-interactive stdin redirection
   * Prevents Windows "Terminate batch job (Y/N)?" prompt from hanging Node.js
   */
  public static async executeCommand(
    rawCwd: string,
    command: string,
    timeoutMs: number = 30000
  ): Promise<CommandResult> {
    return new Promise((resolve) => {
      const cwd = this.sanitizePath(rawCwd);
      const isWindows = process.platform === "win32";

      // On Windows, pipe NUL to stdin so batch prompts like "Terminate batch job (Y/N)?" never block
      const safeCommand = isWindows ? `cmd.exe /c "${command} < NUL"` : `${command} < /dev/null`;

      const options = {
        cwd,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024 * 5,
        env: {
          ...process.env,
          CI: "true",
          FORCE_COLOR: "0",
        },
      };

      exec(safeCommand, options, (error, stdout, stderr) => {
        let outStr = (stdout || "").toString();
        let errStr = (stderr || "").toString();

        // Clean up Windows batch job prompt residue from outputs
        outStr = outStr.replace(/Terminate batch job \(Y\/N\)\?\s*/gi, "");
        errStr = errStr.replace(/Terminate batch job \(Y\/N\)\?\s*/gi, "");

        const exitCode = error && typeof error.code === "number" ? error.code : (error ? 1 : 0);
        resolve({
          stdout: outStr.trim(),
          stderr: errStr.trim() || (error && exitCode !== 0 ? error.message : ""),
          exitCode,
          success: exitCode === 0,
        });
      });
    });
  }

  /**
   * Runs an autonomous task prompt via Hermes Agent CLI with real tool-calling & file scanning
   */
  public static async runHermesAgentTask(
    profileName: string,
    systemPrompt: string,
    taskPrompt: string,
    rawCwd: string,
    onLog?: (logType: "STDOUT" | "STDERR", text: string) => void
  ): Promise<CommandResult> {
    const cwd = this.sanitizePath(rawCwd);
    const hermesBin = this.getHermesCliPath();
    const isWindows = process.platform === "win32";

    // Combine system prompt and user task prompt for full context
    const fullPrompt = `${systemPrompt}\n\n[INSTRUKSI UTAMA]: ${taskPrompt}`;
    const escapedPrompt = fullPrompt.replace(/"/g, '\\"').replace(/\n/g, ' ');

    const command = `${hermesBin} --in "${cwd}" -z "${escapedPrompt}"`;
    return this.executeCommand(cwd, command, 120000);
  }
}
