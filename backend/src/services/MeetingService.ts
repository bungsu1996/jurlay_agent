import { AppDataSource } from "../config/database";
import { Meeting } from "../entities/Meeting";
import { MeetingMessage } from "../entities/MeetingMessage";
import { Employee } from "../entities/Employee";
import { Task } from "../entities/Task";
import { SubTask } from "../entities/SubTask";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { AiRouterService } from "./AiRouterService";
import { TerminalService } from "./TerminalService";
import { FileSystemService } from "./FileSystemService";

export class MeetingService {
  public static async runMeetingDiscussion(io: Server, meetingId: string): Promise<void> {
    const meetingRepo = AppDataSource.getRepository(Meeting);
    const messageRepo = AppDataSource.getRepository(MeetingMessage);
    const empRepo = AppDataSource.getRepository(Employee);
    const taskRepo = AppDataSource.getRepository(Task);
    const subTaskRepo = AppDataSource.getRepository(SubTask);

    const meeting = await meetingRepo.findOne({
      where: { id: meetingId },
      relations: ["task", "task.assigned_pm"],
    });

    if (!meeting || !meeting.task) {
      throw new Error("Meeting atau Task tidak ditemukan");
    }

    meeting.status = "IN_DISCUSSION";
    await meetingRepo.save(meeting);
    io.emit("meeting:status_changed", { meetingId, status: "IN_DISCUSSION" });

    let assignedIds: string[] = [];
    if (meeting.task.assigned_employee_ids_json) {
      try {
        assignedIds = JSON.parse(meeting.task.assigned_employee_ids_json);
      } catch (e) {
        assignedIds = [];
      }
    }

    const allActiveEmployees = await empRepo.find({ where: { is_active: true } });
    const employees = assignedIds.length > 0
      ? allActiveEmployees.filter((e) => assignedIds.includes(e.id))
      : allActiveEmployees;

    const pm = employees.find((e) => e.role === "PM") || (assignedIds.length === 0 ? meeting.task.assigned_pm : undefined);
    const planner = employees.find((e) => e.role === "PLANNER");
    const backend = employees.find((e) => e.role === "BACKEND");
    const frontend = employees.find((e) => e.role === "FRONTEND");
    const reviewer = employees.find((e) => e.role === "CODE_REVIEWER");
    const qa = employees.find((e) => e.role === "QA");
    const devops = employees.find((e) => e.role === "DEVOPS");

    // Helper to send message with typing effect delay and emit to multiple rooms
    const postAIMessage = async (emp: Employee, content: string, delayMs = 1500) => {
      const typingData = { employeeName: emp.name, isTyping: true };
      io.emit(`meeting:typing:${meetingId}`, typingData);
      io.emit(`meeting:typing:${meeting.task.id}`, typingData);
      io.emit("meeting:typing", typingData);

      await new Promise((r) => setTimeout(r, delayMs));

      const msg = messageRepo.create({
        id: uuidv4(),
        meeting_id: meetingId,
        sender_type: "EMPLOYEE",
        employee_id: emp.id,
        content,
      });
      await messageRepo.save(msg);

      const stopTypingData = { employeeName: emp.name, isTyping: false };
      io.emit(`meeting:typing:${meetingId}`, stopTypingData);
      io.emit(`meeting:typing:${meeting.task.id}`, stopTypingData);
      io.emit("meeting:typing", stopTypingData);

      const msgData = {
        ...msg,
        employee: {
          id: emp.id,
          name: emp.name,
          role: emp.role,
          avatar_url: emp.avatar_url,
        },
      };

      io.emit(`meeting:new_message:${meetingId}`, msgData);
      io.emit(`meeting:new_message:${meeting.task.id}`, msgData);
      io.emit("meeting:new_message", msgData);
    };

    const taskTitle = meeting.task.title;
    const taskDesc = meeting.task.description || meeting.task.title;
    const taskRootPath = meeting.task.project_root_path || "Belum ditentukan (Dapat berupa direktori lokal laptop/PC Pak Nyons)";

    const historyMsgs: { sender: string; content: string }[] = [];

    // Helper to generate dynamic response via 9router AI model
    const generateAIMessage = async (
      emp: Employee,
      rolePrompt: string
    ): Promise<string> => {
      try {
        const sysPrompt =
          emp.system_prompt ||
          `Kamu adalah ${emp.name} dengan peran ${emp.role} di Jurlay Agent AI Software House.`;
        const fullPrompt = `${sysPrompt}

[INFORMASI DIREKTORI & PATH LOKAL PROJECT]:
- Root Path Project Tugas ini: "${taskRootPath}"
- Sebagai AI Employee Jurlay Agent, kamu memiliki pemahaman tentang path direktori lokal tempat project disimpan. Kamu DAPAT membaca path ini, menganalisis struktur berkasnya, dan siap menyusun/menjalankan perintah terminal (seperti npm, git, db migrate, dll). JANGAN PERNAH menolak dengan alasan "tidak punya akses terminal/shell execution" atau "tidak bisa baca path lokal".

[INSTRUKSI UTAMA KONTEN DISKUSI (WAJIB DITURUTI)]:
- BAHASAN & RESPON-MU WAJIB 100% MENYAMBUNG DAN BERFOKUS PENUH PADA DESKRIPSI DETAIL DARI CEO BERIKUT:
  "${taskDesc}"
- (PENTING: JANGAN HANYA BERPATOKAN DARI JUDUL TUGAS "${taskTitle}". Judul hanyalah sekadar label pendek. Isi DESKRIPSI UTAMA DARI CEO DI ATAS adalah acuan utama instruksi yang harus kamu bedah, sambungkan, dan tanggapi secara spesifik).

[Tugas Spesifik Peranmu (${emp.role})]:
${rolePrompt}

Jawablah sesuai karakter kepribadianmu sebagai ${emp.name} (${emp.role}). Gunakan Bahasa Indonesia yang natural, santai tapi profesional, dan berikan poin-poin teknis yang spesifik dan langsung menyambung dengan isi deskripsi tugas dari CEO di atas.`;

        const response = await AiRouterService.generateResponse(fullPrompt, historyMsgs, rolePrompt);
        return response;
      } catch (e: any) {
        console.error(`Gagal generate AI message untuk ${emp.name}:`, e);
        return `Siap Lead! Dari perspektif ${emp.role} (${emp.name}), saya siap mendukung perancangan tugas berdasarkan deskripsi: "${taskDesc}".`;
      }
    };

    // ROUND 1: PM Kickoff
    if (pm) {
      const pmKickoffPrompt = `Pak Nyons (CEO) baru saja membuka diskusi/rapat baru.\nARAHAN & DESKRIPSI DETAIL DARI CEO (WAJIB JADI FOKUS UTAMA):\n"${taskDesc}"\n\nRoot Path Project: "${taskRootPath}"\nJudul Tugas: "${taskTitle}"\n\nTugasmu: Sambut seluruh anggota tim AI yang hadir. Pembukaan rapat ini WAJIB 100% mendasarkan pembahasan dari isi DESKRIPSI DETAIL DARI CEO DI ATAS ("${taskDesc}"), bukan sekadar membaca judulnya. Jelaskan poin-poin utama dari deskripsi tersebut dan minta masing-masing spesialis memberikan masukan teknis.`;
      const pmContent = await generateAIMessage(pm, pmKickoffPrompt);
      await postAIMessage(pm, pmContent);
      historyMsgs.push({ sender: pm.name, content: pmContent });
    }

    // ROUND 2: Planner/Architect perspective
    if (planner) {
      const plannerPrompt = `PM (${pm?.name || "Domba"}) baru saja membuka rapat.\nFOKUS DESKRIPSI TUGAS DARI CEO:\n"${taskDesc}"\n\nRoot Path Project: "${taskRootPath}"\n\nTugasmu sebagai Architect (${planner.name}): Berikan analisis arsitektur sistem, alur modul, dan strategi spesifik yang menyambung langsung dengan deskripsi tugas di atas. Berikan 3 poin konkret yang relevan.`;
      const plannerContent = await generateAIMessage(planner, plannerPrompt);
      await postAIMessage(planner, plannerContent);
      historyMsgs.push({ sender: planner.name, content: plannerContent });
    }

    // ROUND 3: Backend perspective
    if (backend) {
      const backendPrompt = `Tanggapi masukan arsitektur dengan berpatokan penuh pada DESKRIPSI TUGAS CEO:\n"${taskDesc}"\n\nRoot Path Project: "${taskRootPath}"\n\nTugasmu sebagai Backend Engineer (${backend.name}): Jelaskan rancangan database schema, endpoint REST API, DTO, atau logika server yang dibutuhkan khusus untuk memenuhi deskripsi tugas tersebut dalam 3 poin teknis.`;
      const backendContent = await generateAIMessage(backend, backendPrompt);
      await postAIMessage(backend, backendContent);
      historyMsgs.push({ sender: backend.name, content: backendContent });
    }

    // ROUND 4: Frontend perspective
    if (frontend) {
      const frontendPrompt = `Tanggapi masukan tim dengan tetap menyambung ke DESKRIPSI TUGAS CEO:\n"${taskDesc}"\n\nRoot Path Project: "${taskRootPath}"\n\nTugasmu sebagai Frontend Engineer (${frontend.name}): Berikan konsep rancangan UI/UX, tata letak komponen, state management, dan interaksi pengguna yang pas untuk memenuhi deskripsi tugas tersebut dalam 3 poin.`;
      const frontendContent = await generateAIMessage(frontend, frontendPrompt);
      await postAIMessage(frontend, frontendContent);
      historyMsgs.push({ sender: frontend.name, content: frontendContent });
    }

    // ROUND 5: Code Reviewer & Quality Standards
    if (reviewer) {
      const reviewerPrompt = `Tanggapi diskusi tim di atas untuk memenuhi DESKRIPSI TUGAS CEO:\n"${taskDesc}"\n\nRoot Path Project: "${taskRootPath}"\n\nTugasmu sebagai Lead Code Reviewer (${reviewer.name}): Berikan masukan kepatuhan Clean Code, prinsip SOLID, audit performa, dan standar kualitas khusus untuk implementasi deskripsi tugas tersebut.`;
      const reviewerContent = await generateAIMessage(reviewer, reviewerPrompt);
      await postAIMessage(reviewer, reviewerContent);
      historyMsgs.push({ sender: reviewer.name, content: reviewerContent });
    }

    // ROUND 6: QA & Risk assessment
    if (qa) {
      const qaPrompt = `Tanggapi diskusi tim di atas untuk memenuhi DESKRIPSI TUGAS CEO:\n"${taskDesc}"\n\nRoot Path Project: "${taskRootPath}"\n\nTugasmu sebagai QA Engineer (${qa.name}): Sebutkan potensi edge-cases, skenario error handling, serta rencana pengujian yang penting untuk deskripsi tugas tersebut.`;
      const qaContent = await generateAIMessage(qa, qaPrompt);
      await postAIMessage(qa, qaContent);
      historyMsgs.push({ sender: qa.name, content: qaContent });
    }

    // ROUND 7: PM Synthesis & Subtasks Plan
    if (pm) {
      const pmSynthesisPrompt = `Berdasarkan seluruh masukan tim di atas untuk memenuhi DESKRIPSI TUGAS CEO:\n"${taskDesc}"\nRoot Path Project: "${taskRootPath}"\n\nBuatkan ringkasan Action Plan final dan sampaikan ke Pak Nyons (CEO) untuk meminta persetujuan.`;
      const planSummary = await generateAIMessage(pm, pmSynthesisPrompt);
      await postAIMessage(pm, planSummary);

      // Create initial sub-tasks
      const subTasksToCreate: Partial<SubTask>[] = [];
      let orderIndex = 1;

      if (planner) {
        subTasksToCreate.push({
          id: uuidv4(),
          task_id: meeting.task.id,
          assigned_employee_id: planner.id,
          title: `[Planner] Blueprint Arsitektur & Spesifikasi untuk ${taskTitle}`,
          description: `Rancang alur sistem, entitas data, dan integrasi antar modul.`,
          status: "TODO",
          order_index: orderIndex++,
        });
      }

      if (backend) {
        subTasksToCreate.push({
          id: uuidv4(),
          task_id: meeting.task.id,
          assigned_employee_id: backend.id,
          title: `[Backend] Implementasi Logic & API untuk ${taskTitle}`,
          description: `Rancang logic backend, entitas data, dan integrasi endpoint sesuai spesifikasi.`,
          status: "TODO",
          order_index: orderIndex++,
        });
      }

      if (frontend) {
        subTasksToCreate.push({
          id: uuidv4(),
          task_id: meeting.task.id,
          assigned_employee_id: frontend.id,
          title: `[Frontend] Pembuatan Komponen UI & Integrasi API`,
          description: `Bangun antarmuka responsif mobile-friendly dengan Tailwind CSS dan sambungkan ke service.`,
          status: "TODO",
          order_index: orderIndex++,
        });
      }

      if (reviewer) {
        subTasksToCreate.push({
          id: uuidv4(),
          task_id: meeting.task.id,
          assigned_employee_id: reviewer.id,
          title: `[Reviewer] Audit Kode, Refactoring & Compliance Clean Code`,
          description: `Periksa kebersihan kode, optimasi performa koding, dan kepatuhan prinsip SOLID.`,
          status: "TODO",
          order_index: orderIndex++,
        });
      }

      if (qa) {
        subTasksToCreate.push({
          id: uuidv4(),
          task_id: meeting.task.id,
          assigned_employee_id: qa.id,
          title: `[QA] Testing, Edge Cases & Security Verification`,
          description: `Lakukan pengujian fungsionalitas, audit keamanan input, dan verifikasi output akhir.`,
          status: "TODO",
          order_index: orderIndex++,
        });
      }

      if (devops) {
        subTasksToCreate.push({
          id: uuidv4(),
          task_id: meeting.task.id,
          assigned_employee_id: devops.id,
          title: `[DevOps] Setup Deployment Pipeline & Verification`,
          description: `Verifikasi build, environment variable, dan kesiapan rilis produksi.`,
          status: "TODO",
          order_index: orderIndex++,
        });
      }

      // Check existing subtasks to avoid duplicates
      const existingSub = await subTaskRepo.find({ where: { task_id: meeting.task.id } });
      if (existingSub.length === 0) {
        await subTaskRepo.save(subTasksToCreate);
      }

      meeting.status = "CONSENSUS_REACHED";
      meeting.concluded_at = new Date();
      await meetingRepo.save(meeting);

      meeting.task.action_plan_summary = planSummary;
      meeting.task.status = "MEETING";
      await taskRepo.save(meeting.task);

      io.emit("meeting:status_changed", { meetingId, status: "CONSENSUS_REACHED" });
      io.emit("task:updated", meeting.task);
    }
  }

  public static async sendCEOMessage(io: Server, meetingId: string, content: string): Promise<MeetingMessage> {
    const meetingRepo = AppDataSource.getRepository(Meeting);
    const messageRepo = AppDataSource.getRepository(MeetingMessage);
    const empRepo = AppDataSource.getRepository(Employee);

    const meeting = await meetingRepo.findOne({
      where: { id: meetingId },
      relations: ["task", "task.assigned_pm"],
    });
    if (!meeting) throw new Error("Meeting tidak ditemukan");

    const msg = messageRepo.create({
      id: uuidv4(),
      meeting_id: meetingId,
      sender_type: "CEO",
      employee_id: null,
      content,
    });
    await messageRepo.save(msg);

    const msgData = {
      ...msg,
      employee: {
        id: "ceo",
        name: "Nyons (CEO)",
        role: "FOUNDER",
        avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=NyonsCEO&backgroundColor=dc2626",
      },
    };

    io.emit(`meeting:new_message:${meetingId}`, msgData);
    if (meeting.task_id) {
      io.emit(`meeting:new_message:${meeting.task_id}`, msgData);
    }
    io.emit("meeting:new_message", msgData);

    // Auto-detect path mentioned by CEO in chat content (e.g. C:\... or D:\... or /c/...)
    const pathMatch = content.match(/([a-zA-Z]:\\[^\s"]+|[a-zA-Z]:\/[^\s"]+|\/c\/[^\s"]+)/);
    if (pathMatch && meeting.task) {
      const detectedPath = pathMatch[0];
      if (!meeting.task.project_root_path || meeting.task.project_root_path !== detectedPath) {
        meeting.task.project_root_path = detectedPath;
        const taskRepo = AppDataSource.getRepository(Task);
        await taskRepo.save(meeting.task);
      }
    }

    // Trigger AI response to CEO's chat asynchronously
    setTimeout(async () => {
      let respondingEmp: Employee | undefined = undefined;
      try {
        let assignedIds: string[] = [];
        if (meeting.task?.assigned_employee_ids_json) {
          try {
            assignedIds = JSON.parse(meeting.task.assigned_employee_ids_json);
          } catch (e) {
            assignedIds = [];
          }
        }

        const allActiveEmployees = await empRepo.find({ where: { is_active: true } });
        const employees = assignedIds.length > 0
          ? allActiveEmployees.filter((e) => assignedIds.includes(e.id))
          : allActiveEmployees;

        const lowerContent = content.toLowerCase();
        
        // Find if any specific employee is mentioned by name or role
        const mentionedEmp = employees.find(
          (e) =>
            lowerContent.includes(e.name.toLowerCase()) ||
            lowerContent.includes(e.role.toLowerCase())
        );

        respondingEmp =
          mentionedEmp ||
          employees[0] ||
          allActiveEmployees.find((e) => e.role === "PM") ||
          allActiveEmployees[0];

        if (respondingEmp) {
          const typingData = { employeeName: respondingEmp.name, isTyping: true };
          io.emit(`meeting:typing:${meetingId}`, typingData);
          if (meeting.task_id) io.emit(`meeting:typing:${meeting.task_id}`, typingData);
          io.emit("meeting:typing", typingData);

          const recentMsgs = await messageRepo.find({
            where: { meeting_id: meetingId },
            relations: ["employee"],
            order: { created_at: "ASC" },
            take: 10,
          });

          const history = recentMsgs.map((m) => ({
            sender: m.sender_type === "CEO" ? "CEO" : m.employee?.name || "AI Staff",
            content: m.content,
          }));

          const taskTitle = meeting.task?.title || "Diskusi";
          const taskDesc = meeting.task?.description || meeting.task?.title || "Tidak ada deskripsi";
          const taskRootPath = meeting.task?.project_root_path || process.cwd();

          // Auto-extract command if CEO asks to run/execute something
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

          const detectedCmd = extractCommandToRun(content);
          let terminalLogContext = "";

          if (detectedCmd) {
            console.log(`[MeetingService] Executing real command "${detectedCmd}" in "${taskRootPath}" for CEO request...`);
            const execRes = await TerminalService.executeCommand(taskRootPath, detectedCmd);
            terminalLogContext = `
[HASIL EKSEKUSI REAL TERMINAL LOKAL PC PAK NYONS]:
- Perintah yang Dijalankan: "${detectedCmd}"
- Path Direktori Pengerjaan: "${taskRootPath}"
- Status Exit Code: ${execRes.exitCode} (${execRes.success ? "SUKSES / 0 ERROR" : "TERJADI ERROR"})
- Console Output (STDOUT):
${execRes.stdout ? execRes.stdout.substring(0, 3000) : "(Kosong)"}
- Error Log Output (STDERR):
${execRes.stderr ? execRes.stderr.substring(0, 3000) : "(Tidak ada error stderr)"}

(PENTING: PERINTAH TERSEBUT SUDAH SELESAI DIJALANKAN LANSUNG DI TERMINAL LOKAL. GUNAKAN DATA LOG REAL DI ATAS DALAM MEREAPON PAK NYONS!)
`;
          }

          // Auto-detect file/folder inspection requests from CEO
          let fileInspectionContext = "";
          const lowerContent = content.toLowerCase();
          if (lowerContent.includes("baca file") || lowerContent.includes("isi file") || lowerContent.includes("cek file") || lowerContent.includes("lihat file")) {
            const filePathMatch = content.match(/([a-zA-Z]:\\[^\s"]+\.[a-zA-Z0-9]+|[a-zA-Z]:\/[^\s"]+\.[a-zA-Z0-9]+|[a-zA-Z0-9_\-\.\:\/\\]+\.[a-zA-Z0-9]+)/);
            if (filePathMatch) {
              let targetFile = filePathMatch[0];
              if (!path.isAbsolute(targetFile) && taskRootPath) {
                targetFile = path.join(taskRootPath, targetFile);
              }
              const fileContent = FileSystemService.readFileContent(targetFile);
              fileInspectionContext = `\n[HASIL MEMBACA FILE DARI DISK LOKAL (${targetFile})]:\n${fileContent}\n`;
            }
          } else if (lowerContent.includes("baca folder") || lowerContent.includes("cek folder") || lowerContent.includes("lihat folder") || lowerContent.includes("isi folder") || lowerContent.includes("akses folder")) {
            const dirContent = FileSystemService.scanDirectory(taskRootPath);
            fileInspectionContext = `\n[HASIL MEMBACA STRUKTUR DIREKTORI DARI DISK LOKAL (${taskRootPath})]:\n${dirContent}\n`;
          }

          const prompt = `${respondingEmp.system_prompt}

Kamu adalah ${respondingEmp.name} (${respondingEmp.role}) dalam ruang rapat tim AI Jurlay Agent.

[KONTEKS TUGAS & DIREKTORI PROJECT LOKAL]:
- Deskripsi / Arahan Utama CEO (WAJIB DITURUTI & DISAMBUNGKAN): "${taskDesc}"
- Root Path Direktori Project: "${taskRootPath}"
- Judul Referensi: "${taskTitle}"

${terminalLogContext}
${fileInspectionContext}

[INFORMASI PENTING KAPABILITAS PEMBUATAN FILE FISIK & TERMINAL]:
- Sebagai AI Employee di Jurlay Agent, kamu MEMILIKI HAK DAN KAPABILITAS UNTUK OTOMATIS MEMBUAT/MENULIS FILE FISIK DI DISK PAK NYONS!
- Jika Pak Nyons meminta membuat/menulis file (atau kamu membuatkan kode file baru), SELALU sertakan baris header sebelum kode block berupa:
  \`Target lokasi file: ${taskRootPath}\\path\\ke\\nama_file.ext\` (atau \`// FILE_PATH: ${taskRootPath}\\path\\ke\\nama_file.ext\`)
- Sistem Jurlay Agent akan OTOMATIS SECARA REAL MEMBUATKAN DAN MENULISKAN FILE FISIK TERSEBUT DI DISK LAPTOP PAK NYONS!
- JANGAN PERNAH menyuruh Pak Nyons menyalin kode secara manual, karena sistem akan menulis file tersebut secara otomatis!

[PESAN TERBARU PAK NYONS (CEO) DI RAPAT]:
"${content}"

[INSTRUKSI PENGERJAAN RESPON]:
1. ${detectedCmd ? `Langsung beritahu Pak Nyons hasil eksekusi terminal real dari perintah "${detectedCmd}" di atas. Jelaskan apakah ada error atau berhasil berdasarkan STDOUT & STDERR log real di atas.` : `Berikan tanggapan yang SELALU MENYAMBUNG dan LURUS DENGAN DESKRIPSI TUGAS CEO DI ATAS ("${taskDesc}"). JANGAN HANYA MEMBACA JUDULNYA.`}
2. Jika diminta membuat file, sediakan kodenya lengkap dengan header target lokasi file agar sistem dapat langsung menulisnya ke disk.
3. Jawab dengan cerdas, ramah, profesional, dan to-the-point sesuai keahlianmu (${respondingEmp.role}) dalam Bahasa Indonesia.`;

          const rawResponseText = await AiRouterService.generateResponse(prompt, history, content);

          // Auto-write files to disk if AI outputted code blocks with file targets
          const { updatedText: responseText } = FileSystemService.processAndWriteFilesFromAiResponse(
            rawResponseText,
            taskRootPath
          );

          const stopTypingData = { employeeName: respondingEmp.name, isTyping: false };
          io.emit(`meeting:typing:${meetingId}`, stopTypingData);
          if (meeting.task_id) io.emit(`meeting:typing:${meeting.task_id}`, stopTypingData);
          io.emit("meeting:typing", stopTypingData);

          const empMsg = messageRepo.create({
            id: uuidv4(),
            meeting_id: meetingId,
            sender_type: "EMPLOYEE",
            employee_id: respondingEmp.id,
            content: responseText,
          });
          await messageRepo.save(empMsg);

          const empMsgData = {
            ...empMsg,
            employee: {
              id: respondingEmp.id,
              name: respondingEmp.name,
              role: respondingEmp.role,
              avatar_url: respondingEmp.avatar_url,
            },
          };

          io.emit(`meeting:new_message:${meetingId}`, empMsgData);
          if (meeting.task_id) io.emit(`meeting:new_message:${meeting.task_id}`, empMsgData);
          io.emit("meeting:new_message", empMsgData);
        }
      } catch (err) {
        console.error("Gagal memproses AI response ke CEO:", err);
        if (respondingEmp) {
          const stopTypingData = { employeeName: respondingEmp.name, isTyping: false };
          io.emit(`meeting:typing:${meetingId}`, stopTypingData);
          if (meeting.task_id) io.emit(`meeting:typing:${meeting.task_id}`, stopTypingData);
          io.emit("meeting:typing", stopTypingData);
        }
      }
    }, 800);

    return msg;
  }
}
