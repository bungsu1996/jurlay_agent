import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Employee } from "../entities/Employee";
import { DirectMessage } from "../entities/DirectMessage";
import { AiRouterService } from "../services/AiRouterService";
import { FileSystemService } from "../services/FileSystemService";
import { HermesBridgeService } from "../services/HermesBridgeService";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import path from "path";

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

      // 3. Auto-detect path & command request dari CEO di chat 1-on-1
      const extractPathFromText = (text: string): string => {
        const winPathMatch = text.match(/([a-zA-Z]:\\[^\s"'\(\)]+|[a-zA-Z]:\/[^\s"'\(\)]+)/);
        if (winPathMatch) return winPathMatch[0];
        return process.cwd();
      };

      const extractCommandToRun = (text: string): string | null => {
        const directMatch = text.match(/(npm\s+(?:run\s+[\w:-]+|install|i|test|build|start|migrate)|npx\s+[\w:-]+|git\s+[\w-]+|node\s+[^\s?]+|python\s+[^\s?]+|dir|ls)/i);
        if (directMatch) return directMatch[0].trim();
        const intentMatch = text.match(/(?:jalankan|run|eksekusi|coba\s+lu\s+jalankan|coba\s+jalankan|tes)\s+([a-zA-Z0-9_\-\.\:\/\\\s]+?)(?=\s*(?:ada error|di path|bro|pak|apakah|\?|$))/i);
        if (intentMatch && intentMatch[1]) {
          const cmd = intentMatch[1].trim();
          if (cmd.length > 2 && !cmd.includes("deskripsi") && !cmd.includes("path")) return cmd;
        }
        return null;
      };

      const rawPath = extractPathFromText(content);
      const sanitizedCwd = HermesBridgeService.sanitizePath(rawPath);
      const detectedCmd = extractCommandToRun(content);

      let terminalLogContext = "";
      if (detectedCmd) {
        console.log(`[DirectChat] Executing command via Hermes Bridge: "${detectedCmd}" in "${sanitizedCwd}" for 1-on-1 Chat...`);
        const execRes = await HermesBridgeService.executeCommand(sanitizedCwd, detectedCmd);
        terminalLogContext = `
[HASIL EKSEKUSI TERMINAL VIA HERMES BRIDGE ENGINE]:
- Perintah Dijalankan: "${detectedCmd}"
- Path Pengerjaan: "${sanitizedCwd}"
- Exit Code: ${execRes.exitCode} (${execRes.success ? "SUKSES / 0 ERROR" : "TERJADI ERROR"})
- Console Output (STDOUT):
${execRes.stdout ? execRes.stdout.substring(0, 3000) : "(Kosong)"}
- Error Log (STDERR):
${execRes.stderr ? execRes.stderr.substring(0, 3000) : "(Tidak ada error)"}
`;
      }

      // 4. Eksekusi AI Response via Hermes Engine System Prompt
      (async () => {
        try {
          const systemPromptWithRules = `${employee.system_prompt}

[INFORMASI PENTING UNTUK CHAT 1-ON-1 WITH HERMES ENGINE]:
- Kamu adalah ${employee.name} (${employee.role}), karyawan AI profesional Pak Nyons.
- Path Kerja Saat Ini: "${sanitizedCwd}"
- ANALISIS CERMAT & TELITI SEJAK PERTAMA KALI: Bedah masalah/error hingga ke akar-akarnya secara cermat sejak giliran pertama.
- DILARANG SPAM KODE PANJANG INLINE: Jika meracik file kode baru/edit, sertakan baris header file (\`Target lokasi file: ${sanitizedCwd}\\nama_file.ext\`) agar sistem menulisnya di background di disk Pak Nyons.
- DILARANG MENYURUH PAK NYONS MANUALLY: JANGAN PERNAH menyuruh Pak Nyons menyimpan file, menjalankan terminal, atau mencoba ulang secara manual! Semuanya sudah otomatis!
${terminalLogContext}`;

          const rawAiResponseText = await AiRouterService.generateResponse(
            systemPromptWithRules,
            recentHistory.map((m) => ({ sender: m.sender, content: m.content })),
            content.trim()
          );

          const { updatedText: aiResponseText } = FileSystemService.processAndWriteFilesFromAiResponse(
            rawAiResponseText,
            sanitizedCwd
          );

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
          console.error("Gagal generate respons Chat 1-on-1 via Hermes Engine:", err);
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
