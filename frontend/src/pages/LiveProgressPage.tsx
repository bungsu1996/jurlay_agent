import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Play,
  PlayCircle,
  Square,
  Loader2,
  Terminal,
  Zap,
} from "lucide-react";
import { api } from "../services/api";
import { getSocket } from "../services/socket";
import { StatusBadge } from "../components/StatusBadge";
import { PageDocBanner } from "../components/PageDocBanner";
import { pageDocs } from "../data/pageDocs";
import { ErrorModal } from "../components/ErrorModal";

interface LiveProgressPageProps {
  tasks: any[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

const ROLE_ORDER: Record<string, number> = {
  PLANNER: 1,
  ARCHITECT: 1,
  BACKEND_DEVELOPER: 2,
  BACKEND: 2,
  FRONTEND_DEVELOPER: 3,
  FRONTEND: 3,
  CODE_REVIEWER: 4,
  QA_TESTER: 5,
  QA: 5,
  DEVOPS_ENGINEER: 6,
  DEVOPS: 6,
  PM: 7,
};

function sortSubTasksByRole(list: any[]): any[] {
  if (!list) return [];
  return [...list].sort((a, b) => {
    const roleA = a.assigned_employee?.role || "";
    const roleB = b.assigned_employee?.role || "";
    const orderA = ROLE_ORDER[roleA] || (a.order_index ? a.order_index : 99);
    const orderB = ROLE_ORDER[roleB] || (b.order_index ? b.order_index : 99);
    if (orderA !== orderB) return orderA - orderB;
    return (a.created_at || "").localeCompare(b.created_at || "");
  });
}

export const LiveProgressPage: React.FC<LiveProgressPageProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [taskDetail, setTaskDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [executingSubTaskId, setExecutingSubTaskId] = useState<string | null>(null);
  const [applyingSubTaskId, setApplyingSubTaskId] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const isRunningRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const activeProgressTasks = tasks.filter((t) => t.status !== "DONE");
  const currentTask =
    activeProgressTasks.find((t) => t.id === selectedTaskId) ||
    activeProgressTasks[0] ||
    tasks.find((t) => t.id === selectedTaskId) ||
    tasks[0];

  useEffect(() => {
    if (currentTask && currentTask.id !== selectedTaskId) {
      onSelectTask(currentTask.id);
    }
  }, [tasks]);

  useEffect(() => {
    if (!currentTask) return;

    loadLogsAndTask(currentTask.id);

    const socket = getSocket();
    const handleLiveLog = (newLog: any) => {
      setLogs((prev) => [...prev, newLog]);
      setTimeout(() => {
        if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
      }, 50);
    };

    const handleSubTaskUpdate = (updatedSub: any) => {
      setTaskDetail((prev: any) => {
        if (!prev || !prev.sub_tasks) return prev;
        const newSubs = prev.sub_tasks.map((st: any) => (st.id === updatedSub.id ? updatedSub : st));

        // Auto trigger next subtask sequentially if Run All mode is active
        if (isRunningRef.current && updatedSub.status === "DONE") {
          const nextSub = newSubs.find((s: any) => s.status === "TODO" || s.status === "FAILED");
          if (nextSub) {
            setTimeout(async () => {
              try {
                if (isRunningRef.current && currentTask?.id) {
                  await api.executeSubTask(currentTask.id, nextSub.id);
                }
              } catch (err: any) {
                console.error("Auto run next subtask error:", err);
                setIsRunningAll(false);
                isRunningRef.current = false;
              }
            }, 1000);
          } else {
            setIsRunningAll(false);
            isRunningRef.current = false;
          }
        }

        return { ...prev, sub_tasks: newSubs };
      });
    };

    socket.on(`task:live_log:${currentTask.id}`, handleLiveLog);
    socket.on("subtask:updated", handleSubTaskUpdate);

    return () => {
      socket.off(`task:live_log:${currentTask.id}`, handleLiveLog);
      socket.off("subtask:updated", handleSubTaskUpdate);
    };
  }, [currentTask?.id]);

  const loadLogsAndTask = async (taskId: string) => {
    try {
      setLoading(true);
      const [taskData, logsData] = await Promise.all([
        api.getTaskById(taskId),
        api.getTaskLogs(taskId),
      ]);
      setTaskDetail(taskData);
      setLogs(logsData || []);
      setTimeout(() => {
        if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (err: any) {
      console.error("Gagal load progres task:", err);
      setErrorMessage(err.message || "Gagal memuat detail dan log progres task.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSubTask = async (subTaskId: string) => {
    if (!currentTask) return;

    const rawList = taskDetail?.sub_tasks || currentTask?.sub_tasks || [];
    const subTasksList = sortSubTasksByRole(rawList);
    const inProgressCount = subTasksList.filter((s: any) => s.status === "IN_PROGRESS").length;

    if (inProgressCount >= 1) {
      setErrorMessage("Maksimal 1 sub-task yang dapat dijalankan secara bersamaan. Mohon tunggu sub-task lain selesai.");
      return;
    }

    try {
      setExecutingSubTaskId(subTaskId);
      await api.executeSubTask(currentTask.id, subTaskId);
    } catch (err: any) {
      setErrorMessage("Gagal menjalankan subtask: " + (err.message || err.toString()));
    } finally {
      setExecutingSubTaskId(null);
    }
  };

  const handleApplyCode = async (subTaskId: string) => {
    if (!currentTask) return;
    try {
      setApplyingSubTaskId(subTaskId);
      await api.applySubTaskCode(currentTask.id, subTaskId);
    } catch (err: any) {
      setErrorMessage("Gagal memicu eksekusi berkas lokal: " + (err.message || err.toString()));
    } finally {
      setApplyingSubTaskId(null);
    }
  };

  const handleRunAllSubTasks = async () => {
    if (!currentTask) return;
    const rawList = taskDetail?.sub_tasks || currentTask?.sub_tasks || [];
    const subTasksList = sortSubTasksByRole(rawList);
    const nextSub = subTasksList.find((s: any) => s.status === "TODO" || s.status === "FAILED");

    if (!nextSub) {
      setErrorMessage("Semua sub-task sudah selesai (DONE).");
      return;
    }

    setIsRunningAll(true);
    isRunningRef.current = true;

    try {
      setExecutingSubTaskId(nextSub.id);
      await api.executeSubTask(currentTask.id, nextSub.id);
    } catch (err: any) {
      setIsRunningAll(false);
      isRunningRef.current = false;
      setErrorMessage("Gagal memicu Run All: " + (err.message || err.toString()));
    } finally {
      setExecutingSubTaskId(null);
    }
  };

  const handleStopRunAll = () => {
    setIsRunningAll(false);
    isRunningRef.current = false;
  };

  const getLogTypeBadge = (type: string) => {
    switch (type) {
      case "INFO":
        return <span className="text-zinc-400 font-bold">[INFO]</span>;
      case "COMMAND":
        return <span className="text-red-400 font-bold">[CMD]</span>;
      case "FILE_WRITE":
        return <span className="text-zinc-200 font-bold">[BERKAS]</span>;
      case "SUCCESS":
        return <span className="text-emerald-400 font-bold">[SUKSES]</span>;
      case "ERROR":
        return <span className="text-red-500 font-bold">[GAGAL]</span>;
      default:
        return <span className="text-zinc-400 font-bold">[{type}]</span>;
    }
  };

  if (!currentTask) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 shadow-sm">
        Belum ada tugas. Silakan buat tugas terlebih dahulu di Papan Tugas.
      </div>
    );
  }

  const rawSubTasks = taskDetail?.sub_tasks || currentTask?.sub_tasks || [];
  const subTasks = sortSubTasksByRole(rawSubTasks);
  const completedCount = subTasks.filter((s: any) => s.status === "DONE").length;
  const inProgressCount = subTasks.filter((s: any) => s.status === "IN_PROGRESS").length;
  const progressPercent = subTasks.length > 0 ? Math.round((completedCount / subTasks.length) * 100) : 0;

  const isMaxRunning = inProgressCount >= 1;

  return (
    <div className="space-y-4">
      {/* Panduan Halaman Lengkap */}
      <PageDocBanner doc={pageDocs.progress} />

      {/* Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Pilih Tugas Progres
            </label>
            <select
              value={currentTask.id}
              onChange={(e) => onSelectTask(e.target.value)}
              className="mt-0.5 block w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 truncate"
            >
              {(activeProgressTasks.length > 0 ? activeProgressTasks : tasks).map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.task_code}] {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress Bar & Actions in Header */}
        <div className="flex items-center gap-3 sm:w-auto">
          <div className="flex-1 space-y-1 sm:w-48">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-500">Total Progres</span>
              <span className="text-red-600 dark:text-red-400 font-mono font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Banner Subtask Aktif Running */}
      {inProgressCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium animate-pulse shadow-sm">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 animate-spin text-red-500 shrink-0" />
            <span>
              ⚡ <strong>{inProgressCount} Sub-task sedang berjalan...</strong> Tim AI sedang membaca berkas dan mengeksekusi instruksi secara nyata.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono bg-red-950/60 px-2 py-0.5 rounded border border-red-900/60 text-red-300">
            <Zap className="w-3 h-3 text-red-400" />
            <span>AI STREAMING</span>
          </div>
        </div>
      )}

      {/* Grid: Subtasks checklist & Live Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sub-tasks Tree */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Sub-task ({completedCount}/{subTasks.length})
            </h3>

            {/* Run All Button */}
            {isRunningAll ? (
              <button
                onClick={handleStopRunAll}
                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-all animate-pulse"
                title="Hentikan eksekusi otomatis antrean sub-task"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop Run All</span>
              </button>
            ) : (
              <button
                disabled={completedCount === subTasks.length || subTasks.length === 0}
                onClick={handleRunAllSubTasks}
                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Jalankan semua sub-task secara berurutan satu per satu dari atas"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Run All</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {subTasks.length === 0 ? (
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 text-center shadow-xs">
                Belum ada subtask pada tiket ini.
              </div>
            ) : (
              subTasks.map((st: any) => (
                <div
                  key={st.id}
                  className={`p-3 rounded-xl border transition-all ${
                    st.status === "IN_PROGRESS"
                      ? "bg-red-50/70 dark:bg-red-950/30 border-red-400 dark:border-red-900 shadow-sm"
                      : st.status === "DONE"
                      ? "bg-white dark:bg-zinc-900 border-emerald-300 dark:border-emerald-800/40"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {st.status === "DONE" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : st.status === "IN_PROGRESS" ? (
                          <Loader2 className="w-4 h-4 text-red-600 dark:text-red-400 animate-spin" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <span>{st.title}</span>
                          {st.status === "IN_PROGRESS" && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 animate-pulse">
                              Processing
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{st.description}</p>
                        <div className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                          <span>PIC: {st.assigned_employee?.name || "Karyawan AI"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <StatusBadge status={st.status} type="task" />
                      {st.status !== "DONE" ? (
                        <button
                          disabled={executingSubTaskId === st.id || st.status === "IN_PROGRESS" || isMaxRunning}
                          onClick={() => handleExecuteSubTask(st.id)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-colors ${
                            st.status === "IN_PROGRESS" || isMaxRunning
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-not-allowed opacity-60"
                              : "bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-950/40 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white border-red-200 dark:border-red-900"
                          }`}
                          title={
                            isMaxRunning && st.status !== "IN_PROGRESS"
                              ? "Maksimal 1 sub-task yang dapat berjalan secara bersamaan"
                              : "Trigger eksekusi subtask ini sekarang"
                          }
                        >
                          {st.status === "IN_PROGRESS" ? (
                            <>
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              <span>Running...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-2.5 h-2.5" />
                              <span>Run</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          disabled={isMaxRunning || executingSubTaskId !== null || applyingSubTaskId !== null}
                          onClick={() => handleApplyCode(st.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-all ${
                            isMaxRunning || executingSubTaskId !== null || applyingSubTaskId !== null
                              ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-300 dark:border-zinc-700 cursor-not-allowed opacity-50"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs active:scale-95 cursor-pointer"
                          }`}
                          title={
                            isMaxRunning || executingSubTaskId !== null || applyingSubTaskId !== null
                              ? "Maksimal 1 sub-task/eksekusi yang dapat berjalan secara bersamaan"
                              : "Eksekusi & terapkan perubahan berkas ke repositori lokal"
                          }
                        >
                          {applyingSubTaskId === st.id ? (
                            <>
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              <span>Executing...</span>
                            </>
                          ) : (
                            <>
                              <Terminal className="w-2.5 h-2.5" />
                              <span>Eksekusi</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Execution Console */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl bg-zinc-950 border border-zinc-300 dark:border-zinc-800 overflow-hidden h-[540px] shadow-xl">
          {/* Console Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-red-500" />
              <span className="text-xs font-mono font-bold text-zinc-200">
                Live Execution Stream & Log (Hermes Agent Engine)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] text-zinc-400 font-mono">Stream Aktif</span>
            </div>
          </div>

          {/* Console Logs Body */}
          <div
            ref={logContainerRef}
            className="flex-1 p-3.5 overflow-y-auto font-mono text-xs space-y-2 leading-relaxed bg-[#09090b] text-zinc-200 selection:bg-red-900 selection:text-white"
          >
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-1.5">
                <Terminal className="w-8 h-8 opacity-40 text-red-500" />
                <p>Menunggu aktivitas eksekusi sub-task...</p>
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={log.id || idx} className="flex items-start gap-2.5">
                  <span className="text-zinc-600 text-[10px] select-none pt-0.5">
                    {new Date(log.created_at || Date.now()).toLocaleTimeString()}
                  </span>
                  <div className="shrink-0">{getLogTypeBadge(log.log_type)}</div>
                  <div className="flex-1 whitespace-pre-wrap break-words text-zinc-300">
                    {log.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ErrorModal
        isOpen={Boolean(errorMessage)}
        message={errorMessage || ""}
        onClose={() => setErrorMessage(null)}
      />
    </div>
  );
};
