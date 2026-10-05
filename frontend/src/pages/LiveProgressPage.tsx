import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Play,
  Terminal,
} from "lucide-react";
import { api } from "../services/api";
import { getSocket } from "../services/socket";
import { StatusBadge } from "../components/StatusBadge";
import { PageDocBanner } from "../components/PageDocBanner";
import { pageDocs } from "../data/pageDocs";

interface LiveProgressPageProps {
  tasks: any[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
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
  const logContainerRef = useRef<HTMLDivElement>(null);

  const currentTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

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
    } catch (err) {
      console.error("Gagal load progres task:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSubTask = async (subTaskId: string) => {
    if (!currentTask) return;
    try {
      setExecutingSubTaskId(subTaskId);
      await api.executeSubTask(currentTask.id, subTaskId);
    } catch (err: any) {
      alert("Gagal menjalankan subtask: " + err.message);
    } finally {
      setExecutingSubTaskId(null);
    }
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

  const subTasks = taskDetail?.sub_tasks || currentTask?.sub_tasks || [];
  const completedCount = subTasks.filter((s: any) => s.status === "DONE").length;
  const progressPercent = subTasks.length > 0 ? Math.round((completedCount / subTasks.length) * 100) : 0;

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
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.task_code}] {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress Bar in Header */}
        <div className="flex items-center gap-3 sm:w-64">
          <div className="flex-1 space-y-1">
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

      {/* Grid: Subtasks checklist & Live Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sub-tasks Tree */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between uppercase tracking-wider">
            <span>Daftar Sub-task Tim AI</span>
            <span className="text-zinc-500 font-normal">
              {completedCount} dari {subTasks.length} selesai
            </span>
          </h3>

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
                      ? "bg-red-50/60 dark:bg-red-950/20 border-red-300 dark:border-red-900/40 shadow-xs"
                      : st.status === "DONE"
                      ? "bg-white dark:bg-zinc-900 border-emerald-300 dark:border-emerald-800/40"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {st.status === "DONE" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : st.status === "IN_PROGRESS" ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{st.title}</h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{st.description}</p>
                        <div className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-semibold">
                          Penanggung Jawab: {st.assigned_employee?.name || "Karyawan AI"}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <StatusBadge status={st.status} type="task" />
                      {st.status !== "DONE" && (
                        <button
                          disabled={executingSubTaskId === st.id}
                          onClick={() => handleExecuteSubTask(st.id)}
                          className="px-2 py-0.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-950/40 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white text-[10px] font-bold border border-red-200 dark:border-red-900 flex items-center gap-1 transition-colors"
                          title="Trigger eksekusi subtask ini sekarang"
                        >
                          <Play className="w-2.5 h-2.5" />
                          <span>Run</span>
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
    </div>
  );
};
