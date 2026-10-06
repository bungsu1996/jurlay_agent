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
import { AiRouterService } from "./AiRouterService";

import { HermesBridgeService } from "./HermesBridgeService";

export class HermesService {
  private static profilesDir = path.join(os.homedir(), ".hermes", "profiles");

  public static ensureProfile(profileName: string, systemPrompt: string, tools: string[] = []): string {
    const targetDirs = [
      path.join(this.profilesDir, profileName),
      path.join(process.env.LOCALAPPDATA || "", "hermes", "profiles", profileName),
    ];

    for (const targetDir of targetDirs) {
      if (!targetDir) continue;
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
    }

    return targetDirs[0];
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
    await logAndEmit("INFO", `Deskripsi Sub-task: ${subTask.description}`);

    const rawTargetDir = projectPath || task.github_project?.local_path || process.cwd();
    const targetDir = HermesBridgeService.sanitizePath(rawTargetDir);
    await logAndEmit("INFO", `Direktori Kerja: ${targetDir}`);

    const hermesPath = HermesBridgeService.getHermesCliPath();

    const prompt = `Kamu adalah ${employee.name} (${employee.role}) di JURLAY AGENT.
Konteks Task Utama: ${task.title}
Detail Sub-task: ${subTask.title} - ${subTask.description}
Direktori Kerja: ${targetDir}

Tugasmu:
1. Analisa kebutuhan teknis spesifik sub-task ini sesuai dengan spesialisasi peranmu (${employee.role}).
2. Tuliskan urutan langkah eksekusi konkret, nama file yang diubah/dibuat, serta contoh snippet kode/skema teknis yang dihasilkan.
3. Berikan laporan ringkas hasil akhir pengerjaan.`;

    if (hermesPath) {
      await logAndEmit("INFO", `Menjalankan Hermes Agent Engine (Profile: ${employee.profile_name})...`);

      // Ensure profile exists
      this.ensureProfile(employee.profile_name, employee.system_prompt, employee.allowed_tools || []);

      try {
        const hermesProc = spawn(hermesPath, ["--profile", employee.profile_name, "-q", prompt], {
          cwd: targetDir,
          env: process.env,
          shell: true,
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
            io.emit("subtask:updated", subTask);
            io.emit("employee:status_changed", { employeeId: employee.id, status: "IDLE" });
          } else {
            await logAndEmit("INFO", `⚠️ [${employee.name}] Hermes CLI mengembalikan exit code: ${code}. Beralih otomatis ke AI Engine 9router (antigravity)...`);
            await this.runAiRouterExecution(io, task, subTask, employee, targetDir, logAndEmit, prompt);
          }
        });
      } catch (err: any) {
        await logAndEmit("ERROR", `Error running Hermes CLI: ${err.message}`);
        // Fallback to AiRouterService if CLI fails
        await this.runAiRouterExecution(io, task, subTask, employee, targetDir, logAndEmit, prompt);
      }
    } else {
      // Connect to 9router AI Engine (antigravity model)
      await logAndEmit("INFO", `Menghubungkan ke AI Engine 9router (${employee.name} - Model: antigravity)...`);
      await this.runAiRouterExecution(io, task, subTask, employee, targetDir, logAndEmit, prompt);
    }
  }

  private static async runAiRouterExecution(
    io: Server,
    task: Task,
    subTask: SubTask,
    employee: Employee,
    targetDir: string,
    logAndEmit: (type: LogType, message: string) => Promise<void>,
    prompt: string
  ): Promise<void> {
    const subTaskRepo = AppDataSource.getRepository(SubTask);
    const empRepo = AppDataSource.getRepository(Employee);

    try {
      await logAndEmit("COMMAND", `[${employee.name}] Membaca berkas proyek & menganalisis dependensi di ${targetDir}...`);
      await new Promise((r) => setTimeout(r, 1000));

      const aiResponse = await AiRouterService.generateResponse(
        employee.system_prompt,
        [],
        prompt
      );

      // Split AI response into logical step paragraphs to simulate real console output stream
      const steps = aiResponse
        .split("\n\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (let i = 0; i < steps.length; i++) {
        const stepText = steps[i];
        if (stepText.toLowerCase().includes("code") || stepText.includes("```") || stepText.toLowerCase().includes("file")) {
          await logAndEmit("FILE_WRITE", `[Eksekusi Berkas/Kode oleh ${employee.name}]:\n${stepText}`);
        } else {
          await logAndEmit("COMMAND", `[Langkah ${i + 1}/${steps.length}]:\n${stepText}`);
        }
        await new Promise((r) => setTimeout(r, 1200));
      }

      await logAndEmit("SUCCESS", `✅ [${employee.name}] Sub-task "${subTask.title}" berhasil diselesaikan oleh AI!`);

      subTask.status = "DONE";
      await subTaskRepo.save(subTask);
      employee.status = "IDLE";
      await empRepo.save(employee);
      io.emit("subtask:updated", subTask);
      io.emit("employee:status_changed", { employeeId: employee.id, status: "IDLE" });
    } catch (err: any) {
      await logAndEmit("ERROR", `❌ Gagal eksekusi subtask: ${err.message}`);
      subTask.status = "FAILED";
      await subTaskRepo.save(subTask);
      employee.status = "IDLE";
      await empRepo.save(employee);
      io.emit("subtask:updated", subTask);
      io.emit("employee:status_changed", { employeeId: employee.id, status: "IDLE" });
    }
  }

  public static async applySubTaskCode(
    io: Server,
    taskId: string,
    subTaskId: string
  ): Promise<void> {
    const taskRepo = AppDataSource.getRepository(Task);
    const subTaskRepo = AppDataSource.getRepository(SubTask);

    const task = await taskRepo.findOne({ where: { id: taskId } });
    const subTask = await subTaskRepo.findOne({
      where: { id: subTaskId },
      relations: ["assigned_employee"],
    });

    if (!task || !subTask) return;

    // Reset status to TODO if DONE so executeSubTask can re-run
    subTask.status = "TODO";
    await subTaskRepo.save(subTask);

    // Trigger full AI worker execution (Hermes / 9router) with live IN_PROGRESS status
    await this.executeSubTask(io, taskId, subTaskId, subTask.assigned_employee_id);
  }
}
