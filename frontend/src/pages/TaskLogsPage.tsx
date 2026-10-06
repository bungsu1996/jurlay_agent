import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  RefreshCw,
  Download,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  User,
  ListFilter,
  Copy,
  Check,
  Folder,
  Code2,
  Layers,
  Sparkles,
  XCircle,
  MessagesSquare,
} from "lucide-react";
import { api } from "../services/api";
import { getSocket } from "../services/socket";
import { PageDocBanner } from "../components/PageDocBanner";
import { pageDocs } from "../data/pageDocs";

interface TaskLogsPageProps {
  tasks: any[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

export const TaskLogsPage: React.FC<TaskLogsPageProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  const currentTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  useEffect(() => {
    if (currentTask && currentTask.id !== selectedTaskId) {
      onSelectTask(currentTask.id);
    }
  }, [tasks]);

  useEffect(() => {
    if (!currentTask) return;
    loadLogs(currentTask.id);

    const socket = getSocket();
    const handleLiveLog = (newLog: any) => {
      setLogs((prev) => [...prev, newLog]);
    };

    const handleNewMessage = (payload: any) => {
      const msg = payload.message || payload;
      if (msg && msg.content) {
        const chatLogItem = {
          id: `meeting-msg-${msg.id || Date.now()}`,
          log_type: "DISCUSSION",
          content: msg.content,
          created_at: msg.created_at || new Date().toISOString(),
          sender_type: msg.sender_type,
          employee: msg.employee || (msg.sender_type === "CEO" ? { name: "Nyons (CEO)", role: "FOUNDER", avatar_url: "👔" } : { name: "Karyawan AI", role: "AI", avatar_url: "💬" }),
        };
        setLogs((prev) => [...prev, chatLogItem]);
      }
    };

    socket.on(`task:live_log:${currentTask.id}`, handleLiveLog);
    socket.on(`meeting:new_message:${currentTask.id}`, handleNewMessage);

    return () => {
      socket.off(`task:live_log:${currentTask.id}`, handleLiveLog);
      socket.off(`meeting:new_message:${currentTask.id}`, handleNewMessage);
    };
  }, [currentTask?.id]);

  const loadLogs = async (taskId: string) => {
    try {
      setLoading(true);
      const [logRes, meetingRes] = await Promise.allSettled([
        api.getTaskLogs(taskId),
        api.getMeetingByTaskId(taskId),
      ]);

      const executionLogs = logRes.status === "fulfilled" && Array.isArray(logRes.value) ? logRes.value : [];
      let discussionLogs: any[] = [];

      const meetingVal = meetingRes.status === "fulfilled" ? meetingRes.value : null;
      const rawMessages = meetingVal?.messages || meetingVal?.data?.messages || (Array.isArray(meetingVal) ? meetingVal : []);

      if (Array.isArray(rawMessages) && rawMessages.length > 0) {
        discussionLogs = rawMessages.map((m: any) => ({
          id: `meeting-msg-${m.id}`,
          log_type: "DISCUSSION",
          content: m.content,
          created_at: m.created_at,
          sender_type: m.sender_type,
          employee: m.employee || (m.sender_type === "CEO" ? { name: "Nyons (CEO)", role: "FOUNDER", avatar_url: "👔" } : { name: "Karyawan AI", role: "AI", avatar_url: "💬" }),
        }));
      }

      const combined = [...executionLogs, ...discussionLogs].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      });

      setLogs(combined);
    } catch (err) {
      console.error("Gagal memuat log task & diskusi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyContent = (id: string | number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportLogs = () => {
    if (!currentTask || logs.length === 0) return;
    const contentLines = [
      `================================================================================`,
      `RIWAYAT LOG EXECUTION & DISKUSI TASK: ${currentTask.title}`,
      `ID Task: ${currentTask.id}`,
      `Root Path: ${currentTask.project_root_path || "C:\\WorkSpace\\Rumah\\jurlay-agent"}`,
      `Waktu Export: ${new Date().toLocaleString()}`,
      `================================================================================`,
      "",
      ...filteredLogs.map((l) => {
        const time = l.created_at ? new Date(l.created_at).toLocaleString() : "LIVE";
        const emp = l.employee?.name || (l.sender_type === "CEO" ? "Nyons (CEO)" : "AI Worker");
        const role = l.employee?.role || (l.sender_type === "CEO" ? "FOUNDER" : "CUSTOM");
        const type = l.log_type || "INFO";
        return `[${time}] [${type}] [${emp} (${role})]\n${l.content}\n--------------------------------------------------------------------------------`;
      }),
    ].join("\n");

    const blob = new Blob([contentLines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `log-task-${currentTask.id.substring(0, 8)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((l) => {
    const matchesType = selectedType === "ALL" || l.log_type === selectedType || (selectedType === "DISCUSSION" && l.log_type === "CHAT");
    const matchesQuery =
      !searchQuery ||
      l.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.employee?.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.log_type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesQuery;
  });

  // Log counts per type
  const discussionCount = logs.filter((l) => l.log_type === "DISCUSSION" || l.log_type === "CHAT").length;
  const commandCount = logs.filter((l) => l.log_type === "COMMAND").length;
  const fileWriteCount = logs.filter((l) => l.log_type === "FILE_WRITE").length;
  const successCount = logs.filter((l) => l.log_type === "SUCCESS").length;
  const errorCount = logs.filter((l) => l.log_type === "ERROR").length;
  const infoCount = logs.filter((l) => l.log_type === "INFO").length;

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "DISCUSSION":
      case "CHAT":
        return {
          badgeBg: "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800",
          cardBorder: "border-l-4 border-l-red-500 border-t border-r border-b border-zinc-200 dark:border-zinc-800",
          icon: <MessagesSquare className="w-3.5 h-3.5 text-red-500" />,
          label: "CHAT DISKUSI",
        };
      case "COMMAND":
        return {
          badgeBg: "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800",
          cardBorder: "border-l-4 border-l-red-500 border-t border-r border-b border-zinc-200 dark:border-zinc-800",
          icon: <Terminal className="w-3.5 h-3.5 text-red-500" />,
          label: "COMMAND EXECUTION",
        };
      case "FILE_WRITE":
        return {
          badgeBg: "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800",
          cardBorder: "border-l-4 border-l-purple-500 border-t border-r border-b border-zinc-200 dark:border-zinc-800",
          icon: <Code2 className="w-3.5 h-3.5 text-purple-500" />,
          label: "FILE MODIFICATION",
        };
      case "SUCCESS":
        return {
          badgeBg: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
          cardBorder: "border-l-4 border-l-emerald-500 border-t border-r border-b border-zinc-200 dark:border-zinc-800",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
          label: "SUKSES",
        };
      case "ERROR":
        return {
          badgeBg: "bg-rose-600 text-white border-rose-700",
          cardBorder: "border-l-4 border-l-rose-600 border-t border-r border-b border-zinc-200 dark:border-zinc-800",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-white" />,
          label: "ERROR GAGAL",
        };
      default:
        return {
          badgeBg: "bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800",
          cardBorder: "border-l-4 border-l-sky-500 border-t border-r border-b border-zinc-200 dark:border-zinc-800",
          icon: <Info className="w-3.5 h-3.5 text-sky-500" />,
          label: "INFORMASI",
        };
    }
  };

  if (!currentTask) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 shadow-sm">
        Belum ada tugas. Silakan buat tugas terlebih dahulu di Papan Tugas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header Doc Banner */}
      <PageDocBanner doc={pageDocs.progress} />

      {/* Task Selection Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {currentTask.priority || "MEDIUM"}
                </span>
                <span className="text-xs text-zinc-500 font-mono">[{currentTask.task_code || "TASK"}]</span>
              </div>
              <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                {currentTask.title}
              </h2>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadLogs(currentTask.id)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span>Refresh Log</span>
            </button>
            <button
              onClick={handleExportLogs}
              disabled={logs.length === 0}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export File .log</span>
            </button>
          </div>
        </div>

        {/* Task Selector & Target Path info */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-zinc-500 whitespace-nowrap">Task:</label>
            <select
              value={currentTask.id}
              onChange={(e) => onSelectTask(e.target.value)}
              className="w-full sm:w-96 font-bold text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-hidden cursor-pointer"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.priority}] {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 truncate">
            <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="font-mono text-[11px] truncate">{currentTask.project_root_path || "C:\\WorkSpace\\Rumah\\jurlay-agent"}</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Entries</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{logs.length}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Commands</span>
            <Terminal className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{commandCount}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">File Modifies</span>
            <Code2 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{fileWriteCount}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Success</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{successCount}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Errors</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{errorCount}</p>
        </div>
      </div>

      {/* Interactive Filter & Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari kata kunci instruksi, nama karyawan, atau berkas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <ListFilter className="w-4 h-4 text-zinc-400 shrink-0 mr-1" />
          {[
            { id: "ALL", label: "SEMUA", count: logs.length },
            { id: "DISCUSSION", label: "DISKUSI", count: discussionCount },
            { id: "COMMAND", label: "COMMAND", count: commandCount },
            { id: "FILE_WRITE", label: "BERKAS", count: fileWriteCount },
            { id: "SUCCESS", label: "SUKSES", count: successCount },
            { id: "ERROR", label: "ERROR", count: errorCount },
            { id: "INFO", label: "INFO", count: infoCount },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedType(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedType === item.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
            >
              <span>{item.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${selectedType === item.id ? "bg-blue-700 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"}`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Detailed Timeline Log Container */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 text-xs text-zinc-500 font-bold">
          <span>Menampilkan {filteredLogs.length} dari {logs.length} catatan log</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Live Socket Stream Active
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 shadow-xs">
            <FileText className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
            <p className="font-bold text-sm">Tidak ada catatan log ditemukan</p>
            <p className="text-xs text-zinc-500 mt-1">Coba ubah kata kunci pencarian atau filter tipe log.</p>
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const style = getTypeStyle(log.log_type);
            const empName = log.employee?.name || (log.sender_type === "CEO" ? "Nyons (CEO)" : "Karyawan AI");
            const empRole = log.employee?.role || (log.sender_type === "CEO" ? "FOUNDER" : "WORKER");
            const empAvatar = log.employee?.avatar_url || (log.sender_type === "CEO" ? "👔" : "💬");
            const timeStr = log.created_at
              ? new Date(log.created_at).toLocaleTimeString()
              : "BARU";
            const dateStr = log.created_at
              ? new Date(log.created_at).toLocaleDateString()
              : "";

            return (
              <div
                key={log.id || idx}
                className={`p-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs transition-all ${style.cardBorder}`}
              >
                {/* Log Item Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    {/* Employee Avatar Badge */}
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-base shrink-0 shadow-2xs border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                      {typeof empAvatar === "string" && (empAvatar.startsWith("http") || empAvatar.startsWith("data:")) ? (
                        <img src={empAvatar} alt={empName} className="w-full h-full object-cover" />
                      ) : empAvatar.length <= 4 ? (
                        empAvatar
                      ) : (
                        <User className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                          {empName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          {empRole}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {dateStr} {timeStr}
                      </span>
                    </div>
                  </div>

                  {/* Right Tags */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border flex items-center gap-1.5 shadow-2xs ${style.badgeBg}`}>
                      {style.icon}
                      <span>{style.label}</span>
                    </span>

                    <button
                      onClick={() => handleCopyContent(log.id || idx, log.content)}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all text-xs flex items-center gap-1 cursor-pointer"
                      title="Salin pesan log ini"
                    >
                      {copiedId === (log.id || idx) ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-500">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Log Content Box */}
                <div className="p-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-inner">
                  {log.content}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
