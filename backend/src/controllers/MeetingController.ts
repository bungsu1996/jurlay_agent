import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Meeting } from "../entities/Meeting";
import { MeetingService } from "../services/MeetingService";
import { Server } from "socket.io";

export class MeetingController {
  public static async getMeetingByTaskId(req: Request, res: Response): Promise<void> {
    try {
      const meetingRepo = AppDataSource.getRepository(Meeting);
      const meeting = await meetingRepo.findOne({
        where: { task_id: req.params.taskId },
        relations: ["task", "messages", "messages.employee"],
        order: {
          messages: {
            created_at: "ASC",
          },
        },
      });

      if (!meeting) {
        res.status(404).json({ success: false, message: "Meeting tidak ditemukan untuk task ini" });
        return;
      }

      res.json({ success: true, data: meeting });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async sendCEOMessage(req: Request, res: Response): Promise<void> {
    try {
      const { content } = req.body;
      if (!content || !content.trim()) {
        res.status(400).json({ success: false, message: "Pesan tidak boleh kosong" });
        return;
      }

      const io: Server = req.app.get("io");
      const message = await MeetingService.sendCEOMessage(io, req.params.id, content.trim());
      res.status(201).json({ success: true, data: message });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async triggerRound(req: Request, res: Response): Promise<void> {
    try {
      const io: Server = req.app.get("io");
      MeetingService.runMeetingDiscussion(io, req.params.id).catch((e) => console.error(e));
      res.json({ success: true, message: "Sesi diskusi AI dijalankan!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
