import React, { useState, useEffect, useRef } from "react";
import {
  MessagesSquare,
  Send,
  Play,
  Bot,
  RefreshCw,
} from "lucide-react";
import { api } from "../services/api";
import { getSocket } from "../services/socket";
import { StatusBadge } from "../components/StatusBadge";
import { NavTab } from "../components/Sidebar";
import { PageDocBanner } from "../components/PageDocBanner";
import { pageDocs } from "../data/pageDocs";

interface MeetingRoomPageProps {
  tasks: any[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onApprovePlan: (taskId: string) => Promise<void>;
  onNavigate: (tab: NavTab) => void;
}

export const MeetingRoomPage: React.FC<MeetingRoomPageProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onApprovePlan,
  onNavigate,
}) => {
  const [meeting, setMeeting] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [ceoInput, setCeoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingState, setTypingState] = useState<{ employeeName: string; isTyping: boolean } | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMeetingTasks = tasks.filter((t) => t.status === "MEETING" || t.status === "BACKLOG" || t.status === "IN_PROGRESS");
  const currentTask = tasks.find((t) => t.id === selectedTaskId) || activeMeetingTasks[0] || tasks[0];

  useEffect(() => {
    if (currentTask && currentTask.id !== selectedTaskId) {
      onSelectTask(currentTask.id);
    }
  }, [tasks]);

  useEffect(() => {
    if (!currentTask) return;

    loadMeetingData(currentTask.id);

    const socket = getSocket();
    const handleNewMessage = (newMsg: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    const handleTyping = (data: { employeeName: string; isTyping: boolean }) => {
      setTypingState(data.isTyping ? data : null);
    };

    const handleStatusChanged = (data: { meetingId: string; status: string }) => {
      setMeeting((prev: any) => prev ? { ...prev, status: data.status } : prev);
    };

    socket.on(`meeting:new_message:${currentTask.id}`, handleNewMessage);
    socket.on(`meeting:typing:${currentTask.id}`, handleTyping);
    socket.on("meeting:status_changed", handleStatusChanged);

    return () => {
      socket.off(`meeting:new_message:${currentTask.id}`, handleNewMessage);
      socket.off(`meeting:typing:${currentTask.id}`, handleTyping);
      socket.off("meeting:status_changed", handleStatusChanged);
    };
  }, [currentTask?.id]);

  const loadMeetingData = async (taskId: string) => {
    try {
      setLoading(true);
      const data = await api.getMeetingByTaskId(taskId);
      setMeeting(data);
      setMessages(data.messages || []);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Gagal load data meeting:", err);
      setMeeting(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCEO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceoInput.trim() || !meeting) return;

    const text = ceoInput.trim();
    setCeoInput("");
    try {
      await api.sendCEOMessage(meeting.id, text);
    } catch (err: any) {
      alert("Gagal mengirim arahan: " + err.message);
    }
  };

  const handleTriggerDiscussion = async () => {
    if (!meeting) return;
    try {
      await api.triggerMeetingRound(meeting.id);
    } catch (err: any) {
      alert("Gagal memicu diskusi: " + err.message);
    }
  };

  const handleApprove = async () => {
    if (!currentTask) return;
    try {
      setIsApproving(true);
      await onApprovePlan(currentTask.id);
      onNavigate("progress");
    } finally {
      setIsApproving(false);
    }
  };

  if (!currentTask) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 shadow-sm">
        Belum ada tugas yang dipilih. Silakan buat tugas terlebih dahulu di Papan Tugas.
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5.5rem)] sm:h-[calc(100vh-6rem)] flex flex-col gap-2.5 overflow-hidden">
      {/* Panduan Halaman Lengkap */}
      <div className="shrink-0">
        <PageDocBanner doc={pageDocs.meetings} />
      </div>

      {/* Top Controls Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Task Selector */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 shrink-0">
            <MessagesSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Tugas yang Sedang Dirapatkan
            </label>
            <select
              value={currentTask.id}
              onChange={(e) => onSelectTask(e.target.value)}
              className="mt-0.5 block w-full max-w-sm sm:max-w-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 truncate"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.task_code}] {t.title} ({t.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTriggerDiscussion}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs border border-zinc-200 dark:border-zinc-700 transition-all shadow-xs"
            title="Panggil tim AI untuk berdiskusi"
          >
            <RefreshCw className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>Picu Diskusi Tim</span>
          </button>

          {currentTask.status === "MEETING" && (
            <button
              disabled={isApproving}
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/30"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isApproving ? "Menyetujui..." : "Setujui Rencana & Gas"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Context Card */}
      <div className="shrink-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 shadow-xs">
        <div className="truncate max-w-xl">
          <span className="font-bold text-red-600 dark:text-red-400">Mandat CEO: </span>
          <span className="text-zinc-500 dark:text-zinc-400">{currentTask.description}</span>
        </div>
        <StatusBadge status={meeting?.status || currentTask.status} type="task" />
      </div>

      {/* Messages Transcript Scroll Area */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 overflow-y-auto space-y-3.5 shadow-sm">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-zinc-400">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <MessagesSquare className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Ruang Rapat Belum Dimulai</h4>
            <p className="text-[11px] max-w-sm text-zinc-500">
              Klik tombol <strong>"Picu Diskusi Tim"</strong> di atas atau kirim arahan CEO di bawah untuk memulai sesi brainstorming!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCEO = msg.sender_type === "CEO";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-3xl ${isCEO ? "ml-auto flex-row-reverse" : ""}`}
              >
                <img
                  src={
                    isCEO
                      ? "https://api.dicebear.com/7.x/bottts/svg?seed=NyonsCEO&backgroundColor=dc2626"
                      : msg.employee?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.employee?.name || "Staff"}`
                  }
                  alt={isCEO ? "CEO" : msg.employee?.name}
                  className={`w-8 h-8 rounded-xl p-0.5 border shrink-0 ${
                    isCEO ? "bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-800" : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  }`}
                />

                <div className={`space-y-1 ${isCEO ? "text-right" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {isCEO ? "Nyons (CEO)" : msg.employee?.name || "AI Staff"}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                        isCEO
                          ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {isCEO ? "FOUNDER" : msg.employee?.role || "AGENT"}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap text-left shadow-xs ${
                      isCEO
                        ? "bg-red-600 text-white rounded-tr-xs font-medium"
                        : "bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-tl-xs"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingState && (
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 animate-pulse pt-1">
            <Bot className="w-4 h-4" />
            <span>{typingState.employeeName} sedang menyusun analisa...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* CEO Input Box */}
      <form onSubmit={handleSendCEO} className="shrink-0 flex gap-2">
        <input
          type="text"
          value={ceoInput}
          onChange={(e) => setCeoInput(e.target.value)}
          placeholder="Ketik catatan, instruksi, atau intervensi CEO di rapat ini..."
          className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition-colors shadow-xs"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-600/30 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Kirim Arahan</span>
        </button>
      </form>
    </div>
  );
};
