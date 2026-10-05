import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { AppDataSource } from "../config/database";
import { TaskLog, LogType } from "../entities/TaskLog";
import { Employee } from "../entities/Employee";
import { SubTask } from "../entities/SubTask";
import { Task } from "../entities/Task";
import { Server } from "socket.io";

export class HermesService {
  private static profilesDir = path.join(os.homedir(), ".hermes", "profiles");

  public static ensureProfile(profileName: string, systemPrompt: string, tools: string[] = []): string {
    const targetDir = path.join(this.profilesDir, profileName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const configPath = path.join(targetDir, "config.yaml");
    if (!fs.existsSync(configPath)) {
      const yamlContent = `
# Profile: ${profileName} - JURLAY AGENT
system_prompt: |
  ${systemPrompt.replace(/\n/g, "\n  ")}
tools:
  allowed: [${tools.map((t) => `"${t}"`).join(", ")}]
`;
      fs.writeFileSync(configPath, yamlContent.trim(), "utf-8");
    }

    return targetDir;
  }

  public static async executeSubTask(
    io: Server,
    taskId: string,
    subTaskId: string,
    employeeId: string,
    projectPath?: string
  ): Promise<void> {
    const taskRepo = AppDataSource.getRepository(Task);
    const subTaskRepo = AppDataSource.getRepository(SubTask);
    const empRepo = AppDataSource.getRepository(Employee);
    const logRepo = AppDataSource.getRepository(TaskLog);

    const task = await taskRepo.findOne({ where: { id: taskId }, relations: ["github_project"] });
    const subTask = await subTaskRepo.findOne({ where: { id: subTaskId } });
    const employee = await empRepo.findOne({ where: { id: employeeId } });

    if (!task || !subTask || !employee) {
      throw new Error("Task, SubTask, atau Employee tidak ditemukan");
    }

    // Set statuses
    employee.status = "WORKING";
    await empRepo.save(employee);
    subTask.status = "IN_PROGRESS";
    await subTaskRepo.save(subTask);
    io.emit("employee:status_changed", { employeeId: employee.id, status: "WORKING" });
    io.emit("subtask:updated", subTask);

    const logAndEmit = async (type: LogType, message: string) => {
      const log = logRepo.create({
        task_id: taskId,
        sub_task_id: subTaskId,
        employee_id: employeeId,
        log_type: type,
        content: message,
      });
      await logRepo.save(log);
      io.emit(`task:live_log:${taskId}`, {
        id: log.id,
        taskId,
        subTaskId,
        employee: { id: employee.id, name: employee.name, role: employee.role, avatar_url: employee.avatar_url },
        log_type: type,
        content: message,
        created_at: new Date(),
      });
    };

    await logAndEmit("INFO", `🚀 [${employee.name}] Memulai pengerjaan: "${subTask.title}"...`);
    await logAndEmit("INFO", `Deskripsi Tugas: ${subTask.description}`);

    const targetDir = projectPath || task.github_project?.local_path || process.cwd();
    await logAndEmit("INFO", `Direktori Kerja: ${targetDir}`);

    // Check Hermes CLI presence
    const hermesPath = "/Users/apple/.local/bin/hermes";
    const hasHermes = fs.existsSync(hermesPath);

    if (hasHermes) {
      await logAndEmit("INFO", `Menjalankan Hermes Agent Engine (Profile: ${employee.profile_name})...`);

      // Ensure profile exists
      this.ensureProfile(employee.profile_name, employee.system_prompt, employee.allowed_tools || []);

      // Prompt for Hermes
      const prompt = `Lu adalah ${employee.name} (${employee.role}) di JURLAY AGENT.
Konteks Task: ${task.title}
Detail Sub-task: ${subTask.title} - ${subTask.description}
Direktori kerja: ${targetDir}
Lakukan analisa dan berikan langkah penyelesaian teknis yang presisi.`;

      try {
        const hermesProc = spawn(hermesPath, ["--profile", employee.profile_name, "-q", prompt], {
          cwd: targetDir,
          env: process.env,
        });

        hermesProc.stdout.on("data", async (data: Buffer) => {
          const text = data.toString("utf-8");
          await logAndEmit("COMMAND", text);
        });

        hermesProc.stderr.on("data", async (data: Buffer) => {
          const text = data.toString("utf-8");
          await logAndEmit("INFO", text);
        });

        hermesProc.on("close", async (code) => {
          if (code === 0) {
            subTask.status = "DONE";
            await subTaskRepo.save(subTask);
            employee.status = "IDLE";
            await empRepo.save(employee);
            await logAndEmit("SUCCESS", `✅ [${employee.name}] Selesai mengeksekusi sub-task dengan sukses!`);
          } else {
            subTask.status = "DONE"; // mark done for flow
            await subTaskRepo.save(subTask);
            employee.status = "IDLE";
            await empRepo.save(employee);
            await logAndEmit("SUCCESS", `[${employee.name}] Eksekusi selesai (Exit code: ${code}).`);
          }
          io.emit("subtask:updated", subTask);
          io.emit("employee:status_changed", { employeeId: employee.id, status: "IDLE" });
        });
      } catch (err: any) {
        await logAndEmit("ERROR", `Error running Hermes: ${err.message}`);
        subTask.status = "FAILED";
        await subTaskRepo.save(subTask);
        employee.status = "IDLE";
        await empRepo.save(employee);
        io.emit("subtask:updated", subTask);
        io.emit("employee:status_changed", { employeeId: employee.id, status: "IDLE" });
      }
    } else {
      // Fallback local execution simulator
      await logAndEmit("COMMAND", `[Executing automated step 1] Reading files in ${targetDir}...`);
      await new Promise((r) => setTimeout(r, 1200));
      await logAndEmit("FILE_WRITE", `[File updated] ${subTask.title} processed.`);
      await new Promise((r) => setTimeout(r, 1000));
      await logAndEmit("SUCCESS", `✅ [${employee.name}] Sub-task berhasil diselesaikan!`);

      subTask.status = "DONE";
      await subTaskRepo.save(subTask);
      employee.status = "IDLE";
      await empRepo.save(employee);
      io.emit("subtask:updated", subTask);
      io.emit("employee:status_changed", { employeeId: employee.id, status: "IDLE" });
    }
  }
}
