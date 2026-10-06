import React, { useState } from "react";
import {
  Plus,
  MessagesSquare,
  Play,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { NavTab } from "../components/Sidebar";
import { PageDocBanner } from "../components/PageDocBanner";
import { pageDocs } from "../data/pageDocs";

interface TaskBoardPageProps {
  tasks: any[];
  projects: any[];
  employees: any[];
  onStartMeeting: (taskId: string) => Promise<void>;
  onApprovePlan: (taskId: string) => Promise<void>;
  onUpdateTaskStatus?: (taskId: string, status: string) => Promise<void>;
  onNavigate: (tab: NavTab) => void;
  onSelectTaskForMeeting: (taskId: string) => void;
  onSelectTaskForProgress: (taskId: string) => void;
  onOpenCreateTask: () => void;
}

export const TaskBoardPage: React.FC<TaskBoardPageProps> = ({
  tasks,
  projects,
  employees,
  onStartMeeting,
  onApprovePlan,
  onUpdateTaskStatus,
  onNavigate,
  onSelectTaskForMeeting,
  onSelectTaskForProgress,
  onOpenCreateTask,
}) => {
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const columns = [
    { id: "BACKLOG", label: "Tugas Baru (Backlog)", color: "border-zinc-300 dark:border-zinc-800" },
    { id: "MEETING", label: "Ruang Diskusi (Meeting)", color: "border-red-300 dark:border-red-900/50" },
    { id: "IN_PROGRESS", label: "Sedang Dikerjakan", color: "border-zinc-400 dark:border-zinc-700" },
    { id: "QA_REVIEW", label: "Audit & Review QA", color: "border-zinc-300 dark:border-zinc-700" },
    { id: "DONE", label: "Selesai (Done)", color: "border-emerald-300 dark:border-emerald-800" },
  ];

  const handleOpenDetail = (task: any) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleStartMeetingClick = async (taskId: string) => {
    try {
      setLoadingAction(true);
      await onStartMeeting(taskId);
      setIsDetailOpen(false);
      onSelectTaskForMeeting(taskId);
      onNavigate("meetings");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleApprovePlanClick = async (taskId: string) => {
    try {
      setLoadingAction(true);
      await onApprovePlan(taskId);
      setIsDetailOpen(false);
      onSelectTaskForProgress(taskId);
      onNavigate("progress");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleMarkDoneClick = async (taskId: string) => {
    try {
      setLoadingAction(true);
      if (onUpdateTaskStatus) {
        await onUpdateTaskStatus(taskId, "DONE");
      }
      setIsDetailOpen(false);
    } catch (err) {
      console.error("Gagal mengubah status ke DONE:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Panduan Halaman Lengkap */}
      <PageDocBanner doc={pageDocs.tasks} />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-600 text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </span>
            <span>Papan Tugas Kanban Tim AI</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Kelola tahapan mandat kerja dari CEO hingga dipecah jadi sub-task dan dieksekusi koding.
          </p>
        </div>

        <button
          onClick={onOpenCreateTask}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-600/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Beri Mandat Baru</span>
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border ${col.color} p-3 min-h-[480px] shadow-sm`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1 mb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  {col.label}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 overflow-y-auto max-h-[650px]">
                {colTasks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    Kosong
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleOpenDetail(task)}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-900 transition-all cursor-pointer shadow-xs group space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-zinc-200 dark:bg-zinc-900 text-red-600 dark:text-red-400 border border-zinc-300 dark:border-zinc-800">
                          {task.task_code}
                        </span>
                        <StatusBadge status={task.priority} type="priority" />
                      </div>

                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                        {task.title}
                      </h4>

                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {task.description}
                      </p>

                      {/* Card Footer */}
                      <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                          <img
                            src={task.assigned_pm?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=PM`}
                            alt="PM"
                            className="w-3.5 h-3.5 rounded-full bg-zinc-200 dark:bg-zinc-800"
                          />
                          <span className="truncate">{task.assigned_pm?.name || "Arya (PM)"}</span>
                        </div>

                        {task.sub_tasks && task.sub_tasks.length > 0 && (
                          <span className="flex items-center gap-1 text-zinc-500 font-mono font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            {task.sub_tasks.filter((s: any) => s.status === "DONE").length}/{task.sub_tasks.length}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail Tugas: [${selectedTask.task_code}]`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {/* Status & Priority Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Status:</span>
                <StatusBadge status={selectedTask.status} type="task" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Prioritas:</span>
                <StatusBadge status={selectedTask.priority} type="priority" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">PIC Utama:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {selectedTask.assigned_pm?.name || "Lead PM Arya"}
                </span>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">{selectedTask.title}</h3>
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedTask.description}
              </div>
            </div>

            {/* Action Plan Summary (if exists) */}
            {selectedTask.action_plan_summary && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 space-y-1.5">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Rencana Tindakan Hasil Rapat AI</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap">
                  {selectedTask.action_plan_summary}
                </p>
              </div>
            )}

            {/* Sub-tasks Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Daftar Sub-task Tim ({selectedTask.sub_tasks?.length || 0})
              </h4>

              {(!selectedTask.sub_tasks || selectedTask.sub_tasks.length === 0) ? (
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-500 text-center border border-zinc-200 dark:border-zinc-800">
                  Belum ada sub-task. Mulai sesi <strong>Ruang Diskusi (Meeting)</strong> agar PM membagi tugas ini!
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedTask.sub_tasks.map((st: any) => (
                    <div
                      key={st.id}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            st.status === "DONE" ? "text-emerald-500" : "text-zinc-400"
                          }`}
                        />
                        <div>
                          <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{st.title}</div>
                          <div className="text-[10px] text-zinc-500">{st.description}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">
                          {st.assigned_employee?.name || "Staff AI"}
                        </span>
                        <StatusBadge status={st.status} type="task" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-end gap-2">
              {selectedTask.status === "BACKLOG" && (
                <button
                  disabled={loadingAction}
                  onClick={() => handleStartMeetingClick(selectedTask.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-600/30 cursor-pointer"
                >
                  <MessagesSquare className="w-3.5 h-3.5" />
                  <span>{loadingAction ? "Memulai..." : "Mulai Rapat Tim di Ruang Diskusi"}</span>
                </button>
              )}

              {selectedTask.status === "MEETING" && (
                <>
                  <button
                    onClick={() => {
                      setIsDetailOpen(false);
                      onSelectTaskForMeeting(selectedTask.id);
                      onNavigate("meetings");
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer"
                  >
                    <MessagesSquare className="w-3.5 h-3.5 text-red-600" />
                    <span>Masuk ke Ruang Rapat</span>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleApprovePlanClick(selectedTask.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{loadingAction ? "Memproses..." : "Setujui Rencana & Gas Eksekusi"}</span>
                  </button>
                </>
              )}

              {(selectedTask.status === "IN_PROGRESS" || selectedTask.status === "QA_REVIEW" || selectedTask.status === "DONE") && (
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    onSelectTaskForProgress(selectedTask.id);
                    onNavigate("progress");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  <span>Pantau Progres Eksekusi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {selectedTask.status !== "DONE" && (
                <button
                  disabled={loadingAction}
                  onClick={() => handleMarkDoneClick(selectedTask.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                  title="Langsung tandai tugas/diskusi ini selesai"
                >
                  {loadingAction ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{loadingAction ? "Memproses..." : "Tandai Selesai (Done)"}</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
