import { AppDataSource } from "../config/database";
import { Meeting } from "../entities/Meeting";
import { MeetingMessage } from "../entities/MeetingMessage";
import { Employee } from "../entities/Employee";
import { Task } from "../entities/Task";
import { SubTask } from "../entities/SubTask";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

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

    const employees = await empRepo.find({ where: { is_active: true } });
    const pm = employees.find((e) => e.role === "PM") || meeting.task.assigned_pm;
    const backend = employees.find((e) => e.role === "BACKEND");
    const frontend = employees.find((e) => e.role === "FRONTEND");
    const qa = employees.find((e) => e.role === "QA");

    // Helper to send message with typing effect delay
    const postAIMessage = async (emp: Employee, content: string, delayMs = 1500) => {
      io.emit(`meeting:typing:${meetingId}`, { employeeName: emp.name, isTyping: true });
      await new Promise((r) => setTimeout(r, delayMs));

      const msg = messageRepo.create({
        id: uuidv4(),
        meeting_id: meetingId,
        sender_type: "EMPLOYEE",
        employee_id: emp.id,
        content,
      });
      await messageRepo.save(msg);

      io.emit(`meeting:typing:${meetingId}`, { employeeName: emp.name, isTyping: false });
      io.emit(`meeting:new_message:${meetingId}`, {
        ...msg,
        employee: {
          id: emp.id,
          name: emp.name,
          role: emp.role,
          avatar_url: emp.avatar_url,
        },
      });
    };

    const taskTitle = meeting.task.title;
    const taskDesc = meeting.task.description;

    // ROUND 1: PM Kickoff
    if (pm) {
      await postAIMessage(
        pm,
        `Halo tim, selamat datang di Meeting Room untuk task [${meeting.task.task_code}]: "${taskTitle}".\n\n📌 Deskripsi dari CEO (Pak Nyons):\n"${taskDesc}"\n\nTolong masing-masing spesialis (${backend?.name || 'Sapi Backend'} & ${frontend?.name || 'Hayam Frontend'}) kasih analisa teknis dan arsitekturnya. Silakan sharing pandangan kalian!`
      );
    }

    // ROUND 2: Backend perspective
    if (backend) {
      await postAIMessage(
        backend,
        `Siap Lead ${pm?.name || 'Domba'}! Dari sisi Backend, untuk task "${taskTitle}", kita perlu:\n1. Siapin schema database/entitas yang rapi dan terisolasi.\n2. Endpoint REST API yang clean dengan validasi DTO ketat.\n3. Error handling & log terpusat agar mudah di-debug.\nGua akan pastikan query dan integrasi datanya aman dan cepet.`
      );
    }

    // ROUND 2: Frontend perspective
    if (frontend) {
      await postAIMessage(
        frontend,
        `Halo tim! Dari sisi Frontend, gua (${frontend.name}) siap bikin antarmukanya:\n1. Desain responsif (mobile friendly & desktop) pake Tailwind CSS warna adem di mata.\n2. State management yang smooth dan interaktif.\n3. Integrasi ke endpoint backend-nya ${backend?.name || 'Sapi'} dengan loading & error indicator yang human-friendly.`
      );
    }

    // ROUND 3: QA & Risk assessment
    if (qa) {
      await postAIMessage(
        qa,
        `Catatan dari QA:\n⚠️ Jangan lupa handle edge cases: input kosong, validasi string, sanitize payload, dan test skenario koneksi putus.\nGua bakal siapin sanity test dan code review begitu kodenya siap!`
      );
    }

    // ROUND 4: PM Synthesis & Subtasks Plan
    if (pm) {
      const planSummary = `Rencana Eksekusi Final:\n- Backend: Implementasi struktur data, API logic & validasi.\n- Frontend: Pembuatan UI/UX responsif & integrasi client-side.\n- QA: Review menyeluruh, edge-case testing, dan verifikasi akhir.`;

      await postAIMessage(
        pm,
        `Mantap tim! Semua masukan udah terangkum.\n\n📋 **Action Plan Selesai:**\n${planSummary}\n\nGua udah buatkan sub-task untuk kalian. Mohon CEO (@Nyons) approve rencana ini agar kita bisa langsung eksekusi!`
      );

      // Create initial sub-tasks
      const subTasksToCreate: Partial<SubTask>[] = [];

      if (backend) {
        subTasksToCreate.push({
          id: uuidv4(),
          task_id: meeting.task.id,
          assigned_employee_id: backend.id,
          title: `[Backend] Implementasi Logic & API untuk ${taskTitle}`,
          description: `Rancang logic backend, entitas data, dan integrasi endpoint sesuai spesifikasi.`,
          status: "TODO",
          order_index: 1,
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
          order_index: 2,
        });
      }

      if (qa) {
        subTasksToCreate.push({
          id: uuidv4(),
          task_id: meeting.task.id,
          assigned_employee_id: qa.id,
          title: `[QA] Testing, Edge Cases & Code Review`,
          description: `Lakukan pengujian fungsionalitas, audit keamanan input, dan verifikasi output akhir.`,
          status: "TODO",
          order_index: 3,
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

    const meeting = await meetingRepo.findOne({ where: { id: meetingId } });
    if (!meeting) throw new Error("Meeting tidak ditemukan");

    const msg = messageRepo.create({
      id: uuidv4(),
      meeting_id: meetingId,
      sender_type: "CEO",
      employee_id: null,
      content,
    });
    await messageRepo.save(msg);

    io.emit(`meeting:new_message:${meetingId}`, {
      ...msg,
      employee: {
        id: "ceo",
        name: "Nyons (CEO)",
        role: "FOUNDER",
        avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=NyonsCEO&backgroundColor=4f46e5",
      },
    });

    return msg;
  }
}
