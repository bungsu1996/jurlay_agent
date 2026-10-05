import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Task } from "../entities/Task";
import { Employee } from "../entities/Employee";
import { Meeting } from "../entities/Meeting";
import { SubTask } from "../entities/SubTask";
import { TaskLog } from "../entities/TaskLog";
import { MeetingService } from "../services/MeetingService";
import { HermesService } from "../services/HermesService";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";

export class TaskController {
  public static async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const taskRepo = AppDataSource.getRepository(Task);
      const tasks = await taskRepo.find({
        relations: ["assigned_pm", "github_project", "sub_tasks", "sub_tasks.assigned_employee", "meeting"],
        order: { created_at: "DESC" },
      });
      res.json({ success: true, data: tasks });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const taskRepo = AppDataSource.getRepository(Task);
      const task = await taskRepo.findOne({
        where: { id: req.params.id },
        relations: ["assigned_pm", "github_project", "sub_tasks", "sub_tasks.assigned_employee", "meeting"],
      });
      if (!task) {
        res.status(404).json({ success: false, message: "Task tidak ditemukan" });
        return;
      }
      res.json({ success: true, data: task });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, priority = "MEDIUM", github_project_id } = req.body;
      if (!title || !description) {
        res.status(400).json({ success: false, message: "Judul dan deskripsi wajib diisi" });
        return;
      }

      const taskRepo = AppDataSource.getRepository(Task);
      const empRepo = AppDataSource.getRepository(Employee);
      const meetingRepo = AppDataSource.getRepository(Meeting);

      // Find or assign PM
      const pm = await empRepo.findOne({ where: { role: "PM", is_active: true } });
      if (!pm) {
        res.status(500).json({ success: false, message: "Tidak ada karyawan dengan role PM yang aktif" });
        return;
      }

      // Generate task code (TASK-001, TASK-002, etc.)
      const count = await taskRepo.count();
      const codeNumber = (count + 1).toString().padStart(3, "0");
      const taskCode = `TASK-${codeNumber}`;

      const taskId = uuidv4();
      const task = taskRepo.create({
        id: taskId,
        task_code: taskCode,
        title,
        description,
        priority,
        status: "BACKLOG",
        assigned_pm_id: pm.id,
        github_project_id: github_project_id || null,
      });

      await taskRepo.save(task);

      // Create linked Meeting
      const meeting = meetingRepo.create({
        id: uuidv4(),
        task_id: taskId,
        status: "PENDING",
      });
      await meetingRepo.save(meeting);

      const savedTask = await taskRepo.findOne({
        where: { id: taskId },
        relations: ["assigned_pm", "github_project", "meeting"],
      });

      const io: Server = req.app.get("io");
      if (io) {
        io.emit("task:created", savedTask);
      }

      res.status(201).json({ success: true, data: savedTask });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async updateTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      const taskRepo = AppDataSource.getRepository(Task);
      const task = await taskRepo.findOne({ where: { id: req.params.id } });
      if (!task) {
        res.status(404).json({ success: false, message: "Task tidak ditemukan" });
        return;
      }

      task.status = status;
      await taskRepo.save(task);

      const io: Server = req.app.get("io");
      if (io) {
        io.emit("task:updated", task);
      }

      res.json({ success: true, data: task });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async startMeeting(req: Request, res: Response): Promise<void> {
    try {
      const taskRepo = AppDataSource.getRepository(Task);
      const meetingRepo = AppDataSource.getRepository(Meeting);

      const task = await taskRepo.findOne({ where: { id: req.params.id } });
      if (!task) {
        res.status(404).json({ success: false, message: "Task tidak ditemukan" });
        return;
      }

      let meeting = await meetingRepo.findOne({ where: { task_id: task.id } });
      if (!meeting) {
        meeting = meetingRepo.create({
          id: uuidv4(),
          task_id: task.id,
          status: "PENDING",
        });
        await meetingRepo.save(meeting);
      }

      task.status = "MEETING";
      await taskRepo.save(task);

      const io: Server = req.app.get("io");
      if (io) {
        io.emit("task:updated", task);
      }

      // Run meeting discussion in background
      MeetingService.runMeetingDiscussion(io, meeting.id).catch((e) => {
        console.error("Meeting run error:", e);
      });

      res.json({ success: true, message: "Meeting berhasil dimulai!", meetingId: meeting.id });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async approvePlan(req: Request, res: Response): Promise<void> {
    try {
      const taskRepo = AppDataSource.getRepository(Task);
      const task = await taskRepo.findOne({
        where: { id: req.params.id },
        relations: ["sub_tasks", "sub_tasks.assigned_employee"],
      });
      if (!task) {
        res.status(404).json({ success: false, message: "Task tidak ditemukan" });
        return;
      }

      task.status = "IN_PROGRESS";
      await taskRepo.save(task);

      const io: Server = req.app.get("io");
      if (io) {
        io.emit("task:updated", task);
      }

      // Automatically trigger the first sub-task
      if (task.sub_tasks && task.sub_tasks.length > 0) {
        const firstSubTask = task.sub_tasks[0];
        HermesService.executeSubTask(
          io,
          task.id,
          firstSubTask.id,
          firstSubTask.assigned_employee_id
        ).catch((e) => console.error("Subtask auto-trigger error:", e));
      }

      res.json({ success: true, message: "Action plan disetujui! Task masuk ke IN PROGRESS", data: task });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async executeSubTask(req: Request, res: Response): Promise<void> {
    try {
      const { taskId, subTaskId } = req.params;
      const subTaskRepo = AppDataSource.getRepository(SubTask);
      const subTask = await subTaskRepo.findOne({ where: { id: subTaskId, task_id: taskId } });

      if (!subTask) {
        res.status(404).json({ success: false, message: "Subtask tidak ditemukan" });
        return;
      }

      const io: Server = req.app.get("io");
      HermesService.executeSubTask(io, taskId, subTaskId, subTask.assigned_employee_id).catch((e) => {
        console.error("Execute subtask error:", e);
      });

      res.json({ success: true, message: "Subtask eksekusi dimulai!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getTaskLogs(req: Request, res: Response): Promise<void> {
    try {
      const logRepo = AppDataSource.getRepository(TaskLog);
      const logs = await logRepo.find({
        where: { task_id: req.params.id },
        relations: ["employee", "sub_task"],
        order: { created_at: "ASC" },
      });
      res.json({ success: true, data: logs });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
