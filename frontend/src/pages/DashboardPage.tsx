import React from "react";
import {
  Users,
  KanbanSquare,
  MessagesSquare,
  GitBranch,
  ArrowUpRight,
  Sparkles,
  Plus,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { NavTab } from "../components/Sidebar";
import { PageDocBanner } from "../components/PageDocBanner";
import { pageDocs } from "../data/pageDocs";

interface DashboardPageProps {
  employees: any[];
  tasks: any[];
  projects: any[];
  onNavigate: (tab: NavTab) => void;
  onOpenCreateTask: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  employees,
  tasks,
  projects,
  onNavigate,
  onOpenCreateTask,
}) => {
  const activeTasks = tasks.filter((t) => t.status !== "DONE");
  const completedTasks = tasks.filter((t) => t.status === "DONE");
  const inMeetingTasks = tasks.filter((t) => t.status === "MEETING");

  return (
    <div className="space-y-4">
      {/* Panduan Halaman Lengkap */}
      <PageDocBanner doc={pageDocs.dashboard} />

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Markas Eksekutif JURLAY AGENT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Selamat Datang, CEO Nyons! 🚀
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Karyawan AI Anda siap menerima arahan. Delegasikan mandat ke Lead PM Domba, tim akan langsung rapat di Ruang Diskusi untuk merumuskan arsitektur sebelum eksekusi koding!
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
            <button
              onClick={onOpenCreateTask}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Beri Mandat Tugas Baru</span>
            </button>
            <button
              onClick={() => onNavigate("meetings")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs border border-zinc-200 dark:border-zinc-700 transition-all shadow-xs"
            >
              <MessagesSquare className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Pantau Ruang Diskusi</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigate("tasks")}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-900 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tugas Aktif</span>
            <KanbanSquare className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{activeTasks.length}</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1 font-medium">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{completedTasks.length} Selesai</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate("meetings")}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-900 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ruang Diskusi</span>
            <MessagesSquare className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{inMeetingTasks.length}</div>
          <div className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-1">Sesi AI Rapat Aktif</div>
        </div>

        <div
          onClick={() => onNavigate("employees")}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-900 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Karyawan AI</span>
            <Users className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{employees.length}</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Personil Stand by</div>
        </div>

        <div
          onClick={() => onNavigate("github")}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-900 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Workspace Repo</span>
            <GitBranch className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{projects.length}</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Repo Terhubung</div>
        </div>
      </div>

      {/* Employees Live Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-red-600" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Status Live Tim Karyawan AI</h2>
          </div>
          <button
            onClick={() => onNavigate("employees")}
            className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
          >
            Buka Chat & Tim <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between shadow-xs"
            >
              <div className="flex items-start gap-2.5">
                <img
                  src={emp.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${emp.name}`}
                  alt={emp.name}
                  className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{emp.name}</h4>
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-bold">{emp.role}</p>
                </div>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <StatusBadge status={emp.status} type="employee" />
                <span className="text-[10px] text-zinc-400 font-mono">@{emp.profile_name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KanbanSquare className="w-4 h-4 text-red-600" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Daftar Mandat Tugas Terbaru</h2>
          </div>
          <button
            onClick={() => onNavigate("tasks")}
            className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
          >
            Lihat Semua Papan <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 shadow-sm">
              Belum ada tugas. Klik tombol <strong>+ Beri Mandat Tugas Baru</strong> di atas untuk mulai mendelegasikan tugas ke tim AI!
            </div>
          ) : (
            tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                onClick={() => onNavigate("tasks")}
                className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-400/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-red-600 dark:text-red-400 text-[11px] font-mono font-bold border border-zinc-200 dark:border-zinc-700">
                    {task.task_code}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{task.title}</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-md">{task.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={task.priority} type="priority" />
                  <StatusBadge status={task.status} type="task" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
