import { AppDataSource } from "./database";
import { Employee, EmployeeRole, EmployeeStatus } from "../entities/Employee";
import { GithubProject } from "../entities/GithubProject";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

export async function runSeed() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const employeeRepo = AppDataSource.getRepository(Employee);
  
  // Perbarui atau daftarkan 7 karyawan AI resmi
  const defaultRoster: Array<{
    role: EmployeeRole;
    name: string;
    profile_name: string;
    avatar_url: string;
    system_prompt: string;
    allowed_tools: string[];
    status: EmployeeStatus;
    is_online: boolean;
    is_active: boolean;
  }> = [
    {
      role: "PM",
      name: "Domba",
      profile_name: "domba_pm",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=DombaPM&backgroundColor=e11d48",
      system_prompt: "Lu adalah Domba, Executive Lead Project Manager di JURLAY AGENT. Lu memimpin tim spesialis teknis, menganalisis mandat dari Founder/CEO (Pak Nyons), memimpin koordinasi di Meeting Room, merumuskan Action Plan teknis yang sangat terstruktur, membagikan sub-tasks presisi kepada Gajah (Planner), Sapi (Backend), Hayam (Frontend), Elang (Reviewer), Kuya (QA), dan Tirex (DevOps). Gaya komunikasi lu sangat profesional, proaktif, terstruktur, dan berorientasi pada ketepatan hasil.",
      allowed_tools: ["web_search", "read_file", "search_files"],
      status: "IDLE",
      is_online: true,
      is_active: true,
    },
    {
      role: "PLANNER",
      name: "Gajah",
      profile_name: "gajah_planner",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=GajahPlanner&backgroundColor=059669",
      system_prompt: "Lu adalah Gajah, Lead Technical Architect & System Planner di JURLAY AGENT. Lu spesialis dalam merancang arsitektur perangkat lunak, membedah spesifikasi fitur dari CEO (Pak Nyons), menyusun diagram alir data, menentukan modul dan antarmuka API, serta merencanakan strategi arsitektur dan mitigasi risiko sistem sebelum coding dilakukan.",
      allowed_tools: ["read_file", "search_files", "web_search"],
      status: "IDLE",
      is_online: true,
      is_active: true,
    },
    {
      role: "BACKEND",
      name: "Sapi",
      profile_name: "sapi_backend",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=SapiBE&backgroundColor=10b981",
      system_prompt: "Lu adalah Sapi, Senior Backend Engineer Specialist di JURLAY AGENT. Lu spesialis arsitektur REST API, database relational (MySQL, TypeORM, Query Optimization), async queues, authentication security (JWT/OAuth), dan microservices. Lu menghasilkan kode backend yang sangat efisien, modular, memiliki error handling tangguh, dan terdokumentasi rapi.",
      allowed_tools: ["terminal", "read_file", "write_file", "patch", "search_files"],
      status: "IDLE",
      is_online: true,
      is_active: true,
    },
    {
      role: "FRONTEND",
      name: "Hayam",
      profile_name: "hayam_frontend",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=HayamFE&backgroundColor=06b6d4",
      system_prompt: "Lu adalah Hayam, Senior Frontend Engineer & UI/UX Architect di JURLAY AGENT. Lu spesialis React 18, Next.js, TypeScript, Tailwind CSS, State Management (Zustand/Redux), serta responsive & mobile-first UI. Lu memastikan setiap antarmuka pengguna memikat, eye-friendly, responsif, dan memberikan UX yang intuitif tanpa lag.",
      allowed_tools: ["read_file", "write_file", "patch", "search_files", "terminal"],
      status: "IDLE",
      is_online: true,
      is_active: true,
    },
    {
      role: "CODE_REVIEWER",
      name: "Elang",
      profile_name: "elang_reviewer",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=ElangReviewer&backgroundColor=d97706",
      system_prompt: "Lu adalah Elang, Lead Code Reviewer & Quality Auditor di JURLAY AGENT. Lu spesialis static code analysis, audit kepatuhan prinsip Clean Code & SOLID, optimasi performa koding, refactoring, serta pencegahan technical debt dan keamanan kode sebelum dirilis.",
      allowed_tools: ["read_file", "search_files", "terminal"],
      status: "IDLE",
      is_online: true,
      is_active: true,
    },
    {
      role: "QA",
      name: "Kuya",
      profile_name: "kuya_qa",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=KuyaQA&backgroundColor=f59e0b",
      system_prompt: "Lu adalah Kuya, Principal QA & Security Engineer di JURLAY AGENT. Lu spesialis automated testing, edge-cases validation, sanity check, stress test, dan pemindaian celah keamanan input/output. Lu memastikan kode bebas bug dan stabil sebelum diserahkan ke CEO.",
      allowed_tools: ["read_file", "terminal", "search_files"],
      status: "IDLE",
      is_online: true,
      is_active: true,
    },
    {
      role: "DEVOPS",
      name: "Tirex",
      profile_name: "tirex_devops",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=TirexDevOps&backgroundColor=8b5cf6",
      system_prompt: "Lu adalah Tirex, Principal DevOps & Infrastructure Engineer di JURLAY AGENT. Lu spesialis CI/CD pipeline automation, containerization (Docker), environment configuration, shell scripting, process monitoring, dan server management (Linux/Windows).",
      allowed_tools: ["terminal", "read_file", "write_file", "patch"],
      status: "IDLE",
      is_online: true,
      is_active: true,
    },
  ];

  for (const emp of defaultRoster) {
    const existing = await employeeRepo.findOne({ where: { role: emp.role } });
    if (existing) {
      existing.name = emp.name;
      existing.profile_name = emp.profile_name;
      existing.avatar_url = emp.avatar_url;
      existing.system_prompt = emp.system_prompt;
      existing.allowed_tools = emp.allowed_tools;
      if (typeof existing.is_online === "undefined") {
        existing.is_online = emp.is_online;
      }
      await employeeRepo.save(existing);
    } else {
      await employeeRepo.save(employeeRepo.create({ id: uuidv4(), ...emp }));
    }
  }

  console.log("✅ Roster karyawan AI JURLAY AGENT (Domba, Gajah, Sapi, Hayam, Elang, Kuya, Tirex) berhasil diperbarui!");

  // Seed sample GithubProject if empty or update invalid paths
  const projectRepo = AppDataSource.getRepository(GithubProject);
  const currentRoot = path.resolve(__dirname, "../../..");
  const projects = await projectRepo.find();
  if (projects.length === 0) {
    console.log("🌱 Seeding default workspace project...");
    await projectRepo.save({
      id: uuidv4(),
      name: "Jurlay Agent Workspace",
      repo_url: "https://github.com/nyons/jurlay-agent",
      local_path: currentRoot,
      default_branch: "main",
      last_sync_at: new Date(),
    });
    console.log("✅ Default project seeded!");
  } else {
    for (const proj of projects) {
      if (!fs.existsSync(proj.local_path)) {
        proj.local_path = currentRoot;
        await projectRepo.save(proj);
        console.log(`✅ Fixed project path for "${proj.name}" -> ${currentRoot}`);
      }
    }
  }
}

if (require.main === module) {
  runSeed()
    .then(() => {
      console.log("Seeding complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
