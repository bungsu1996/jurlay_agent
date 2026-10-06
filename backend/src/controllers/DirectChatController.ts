import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Employee } from "../entities/Employee";
import { DirectMessage } from "../entities/DirectMessage";
import { AiRouterService } from "../services/AiRouterService";
import { FileSystemService } from "../services/FileSystemService";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";

export class DirectChatController {
  public static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const msgRepo = AppDataSource.getRepository(DirectMessage);
      const messages = await msgRepo.find({
        where: { employee_id: employeeId },
        order: { created_at: "ASC" },
        take: 100,
      });

      res.json({ success: true, data: messages });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({ success: false, message: "Pesan tidak boleh kosong" });
        return;
      }

      const empRepo = AppDataSource.getRepository(Employee);
      const msgRepo = AppDataSource.getRepository(DirectMessage);

      const employee = await empRepo.findOne({ where: { id: employeeId } });
      if (!employee) {
        res.status(404).json({ success: false, message: "Karyawan tidak ditemukan" });
        return;
      }

      // 1. Simpan pesan dari CEO
      const ceoMessage = msgRepo.create({
        id: uuidv4(),
        employee_id: employeeId,
        sender: "CEO",
        content: content.trim(),
      });
      await msgRepo.save(ceoMessage);

      const io: Server = req.app.get("io");
      if (io) {
        io.emit(`direct_message:${employeeId}`, ceoMessage);
        // Nyalakan indikator sedang mengetik (real-time thinking)
        io.emit(`direct_message:typing:${employeeId}`, { isTyping: true, employeeName: employee.name });
      }

      // Kirim status sukses penerimaan pesan ke client
      res.status(201).json({ success: true, data: ceoMessage });

      // 2. Ambil riwayat chat sebelumnya untuk konteks model
      const recentHistory = await msgRepo.find({
        where: { employee_id: employeeId },
        order: { created_at: "ASC" },
        take: 15,
      });

      // 3. Panggil 9router model combogravuty secara asinkron
      (async () => {
        try {
          const rawAiResponseText = await AiRouterService.generateResponse(
            employee.system_prompt,
            recentHistory.map((m) => ({ sender: m.sender, content: m.content })),
            content.trim()
          );

          const { updatedText: aiResponseText } = FileSystemService.processAndWriteFilesFromAiResponse(rawAiResponseText);

          const aiMessage = msgRepo.create({
            id: uuidv4(),
            employee_id: employeeId,
            sender: "EMPLOYEE",
            content: aiResponseText,
          });
          await msgRepo.save(aiMessage);

          if (io) {
            io.emit(`direct_message:${employeeId}`, aiMessage);
            io.emit(`direct_message:typing:${employeeId}`, { isTyping: false });
          }
        } catch (err: any) {
          console.error("Gagal generate respons 9router combogravuty:", err);
          if (io) {
            io.emit(`direct_message:typing:${employeeId}`, { isTyping: false });
          }
        }
      })();
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
