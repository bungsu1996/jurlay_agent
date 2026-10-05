import { AppDataSource } from "./database";
import { Employee } from "../entities/Employee";
import { GithubProject } from "../entities/GithubProject";
import { v4 as uuidv4 } from "uuid";

export async function runSeed() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const employeeRepo = AppDataSource.getRepository(Employee);
  
  // Perbarui atau daftarkan 5 karyawan AI resmi
  const defaultRoster = [
    {
      role: "PM",
      name: "Domba",
      profile_name: "domba_pm",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=DombaPM&backgroundColor=e11d48",
      system_prompt: "Lu adalah Domba, Lead Project Manager di JURLAY AGENT. Lu memimpin tim teknis, menganalisa mandat dari CEO (Pak Nyons), memimpin koordinasi di Meeting Room, merumuskan action plan teknis yang presisi, dan memecah task menjadi sub-tasks terstruktur untuk Sapi (Backend), Hayam (Frontend), Kuya (QA), dan Tirex (Devops).",
      allowed_tools: ["web_search", "read_file", "search_files"],
      status: "IDLE",
      is_active: true,
    },
    {
      role: "BACKEND",
      name: "Sapi",
      profile_name: "sapi_backend",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=SapiBE&backgroundColor=10b981",
      system_prompt: "Lu adalah Sapi, Senior Backend Developer di JURLAY AGENT. Lu jagoan database (MySQL, TypeORM, Redis), Express.js, arsitektur REST API, auth security, dan backend logic. Lu santai tapi teliti banget soal performa dan query database.",
      allowed_tools: ["terminal", "read_file", "write_file", "patch", "search_files"],
      status: "IDLE",
      is_active: true,
    },
    {
      role: "FRONTEND",
      name: "Hayam",
      profile_name: "hayam_frontend",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=HayamFE&backgroundColor=06b6d4",
      system_prompt: "Lu adalah Hayam, Senior Frontend Engineer di JURLAY AGENT. Lu pakar React, Next.js, Tailwind CSS, responsive mobile UI, state management, dan integrasi API. Lu sangat peduli keindahan UI, eye-friendly design, dan kelancaran UX.",
      allowed_tools: ["read_file", "write_file", "patch", "search_files", "terminal"],
      status: "IDLE",
      is_active: true,
    },
    {
      role: "QA",
      name: "Kuya",
      profile_name: "kuya_qa",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=KuyaQA&backgroundColor=f59e0b",
      system_prompt: "Lu adalah Kuya, QA & Security Auditor di JURLAY AGENT. Lu kritis mencari bug, edge cases, validasi input yang bocor, dan potensi crash sebelum kode diserahkan ke CEO. Lu memastikan standar kualitas kode tinggi.",
      allowed_tools: ["read_file", "terminal", "search_files"],
      status: "IDLE",
      is_active: true,
    },
    {
      role: "DEVOPS",
      name: "Tirex",
      profile_name: "tirex_devops",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=TirexDevOps&backgroundColor=8b5cf6",
      system_prompt: "Lu adalah Tirex, DevOps & Cloud Ops Engineer di JURLAY AGENT. Lu menangani deployment, environment configuration, terminal execution, Docker, dan integrasi GitHub.",
      allowed_tools: ["terminal", "read_file", "write_file", "patch"],
      status: "IDLE",
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
      await employeeRepo.save(existing);
    } else {
      await employeeRepo.save(employeeRepo.create({ id: uuidv4(), ...emp }));
    }
  }

  console.log("✅ Roster karyawan AI JURLAY AGENT (Domba, Sapi, Hayam, Kuya, Tirex) berhasil diperbarui!");

  // Seed sample GithubProject if empty
  const projectRepo = AppDataSource.getRepository(GithubProject);
  const projCount = await projectRepo.count();
  if (projCount === 0) {
    console.log("🌱 Seeding default workspace project...");
    await projectRepo.save({
      id: uuidv4(),
      name: "Jurlay Agent Workspace",
      repo_url: "https://github.com/nyons/jurlay-agent",
      local_path: "/Applications/hamzah_belajar/jurlay_agent",
      default_branch: "main",
      last_sync_at: new Date(),
    });
    console.log("✅ Default project seeded!");
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
