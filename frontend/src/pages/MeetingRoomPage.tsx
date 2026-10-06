import React, { useState, useEffect, useRef } from "react";
import {
  MessagesSquare,
  Send,
  Play,
  Bot,
  RefreshCw,
  Loader2,
  Plus,
  MessageSquarePlus,
  Sparkles,
  MessageCircle,
  Zap,
} from "lucide-react";
import { api } from "../services/api";
import { getSocket } from "../services/socket";
import { StatusBadge } from "../components/StatusBadge";
import { NavTab } from "../components/Sidebar";
import { PageDocBanner } from "../components/PageDocBanner";
import { pageDocs } from "../data/pageDocs";
import { ErrorModal } from "../components/ErrorModal";
import { Modal } from "../components/Modal";

interface MeetingRoomPageProps {
  tasks: any[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onApprovePlan: (taskId: string) => Promise<void>;
  onNavigate: (tab: NavTab) => void;
  onRefreshTasks?: () => Promise<void>;
}

export const MeetingRoomPage: React.FC<MeetingRoomPageProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onApprovePlan,
  onNavigate,
  onRefreshTasks,
}) => {
  const [meeting, setMeeting] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [ceoInput, setCeoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingState, setTypingState] = useState<{ employeeName: string; isTyping: boolean } | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Discussion Modal State
  const [isCreateDiscOpen, setIsCreateDiscOpen] = useState(false);
  const [discTitle, setDiscTitle] = useState("");
  const [discDescription, setDiscDescription] = useState("");
  const [isCreatingDisc, setIsCreatingDisc] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);

  useEffect(() => {
    api.getEmployees()
      .then((res) => {
        if (Array.isArray(res)) setEmployees(res);
      })
      .catch((err) => console.error(err));
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMeetingTasks = tasks.filter((t) => t.status !== "DONE");
  const currentTask = activeMeetingTasks.find((t) => t.id === selectedTaskId) || activeMeetingTasks[0];

  useEffect(() => {
    if (currentTask && currentTask.id !== selectedTaskId) {
      onSelectTask(currentTask.id);
    }
  }, [tasks]);

  useEffect(() => {
    if (!currentTask) return;

    loadMeetingData(currentTask.id);
  }, [currentTask?.id]);

  useEffect(() => {
    const socket = getSocket();
    const handleNewMessage = (newMsg: any) => {
      if (!newMsg) return;

      const isForCurrentMeeting =
        (meeting && newMsg.meeting_id === meeting.id) ||
        (currentTask && (newMsg.task_id === currentTask.id || newMsg.meeting?.task_id === currentTask.id));

      if (isForCurrentMeeting) {
        setMessages((prev) => {
          // Ignore duplicate ID
          if (newMsg.id && prev.some((m) => m.id === newMsg.id)) return prev;
          // Filter out matching tempMsg if real message comes in
          const filtered = prev.filter(
            (m) => !(typeof m.id === "string" && m.id.startsWith("temp-") && m.content === newMsg.content)
          );
          return [...filtered, newMsg];
        });
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    const handleTyping = (data: { employeeName: string; isTyping: boolean }) => {
      setTypingState(data.isTyping ? data : null);
    };

    const handleStatusChanged = (data: { meetingId: string; status: string }) => {
      setMeeting((prev: any) => (prev && prev.id === data.meetingId ? { ...prev, status: data.status } : prev));
    };

    const taskId = currentTask?.id;
    const meetingId = meeting?.id;

    if (taskId) {
      socket.on(`meeting:new_message:${taskId}`, handleNewMessage);
      socket.on(`meeting:typing:${taskId}`, handleTyping);
    }
    if (meetingId) {
      socket.on(`meeting:new_message:${meetingId}`, handleNewMessage);
      socket.on(`meeting:typing:${meetingId}`, handleTyping);
    }

    socket.on("meeting:new_message", handleNewMessage);
    socket.on("meeting:typing", handleTyping);
    socket.on("meeting:status_changed", handleStatusChanged);

    return () => {
      if (taskId) {
        socket.off(`meeting:new_message:${taskId}`, handleNewMessage);
        socket.off(`meeting:typing:${taskId}`, handleTyping);
      }
      if (meetingId) {
        socket.off(`meeting:new_message:${meetingId}`, handleNewMessage);
        socket.off(`meeting:typing:${meetingId}`, handleTyping);
      }
      socket.off("meeting:new_message", handleNewMessage);
      socket.off("meeting:typing", handleTyping);
      socket.off("meeting:status_changed", handleStatusChanged);
    };
  }, [currentTask?.id, meeting?.id]);

  const loadMeetingData = async (taskId: string) => {
    try {
      setLoading(true);
      const data = await api.getMeetingByTaskId(taskId);
      setMeeting(data);
      setMessages(data.messages || []);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error("Gagal load data meeting:", err);
      setMeeting(null);
      setMessages([]);
      setErrorMessage(err.message || "Gagal memuat data meeting ruang diskusi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendCEO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceoInput.trim() || !meeting || isSending) return;

    const text = ceoInput.trim();
    setCeoInput("");
    setIsSending(true);

    // Optimistic UI update for CEO message
    const tempId = "temp-" + Date.now();
    const tempMsg = {
      id: tempId,
      meeting_id: meeting.id,
      sender_type: "CEO",
      employee_id: null,
      content: text,
      created_at: new Date().toISOString(),
      employee: {
        id: "ceo",
        name: "Nyons (CEO)",
        role: "FOUNDER",
        avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=NyonsCEO&backgroundColor=dc2626",
      },
    };

    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const createdMsg = await api.sendCEOMessage(meeting.id, text);
      // Replace tempMsg cleanly with real createdMsg, or remove tempMsg if socket already appended it
      setMessages((prev) => {
        if (!createdMsg) return prev;
        if (prev.some((m) => m.id === createdMsg.id)) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? createdMsg : m));
      });
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setErrorMessage("Gagal mengirim arahan CEO: " + (err.message || err.toString()));
    } finally {
      setIsSending(false);
    }
  };

  const handleTriggerDiscussion = async () => {
    if (!meeting || isTriggering) return;
    setIsTriggering(true);
    try {
      await api.triggerMeetingRound(meeting.id);
    } catch (err: any) {
      setErrorMessage("Gagal memicu diskusi tim AI: " + (err.message || err.toString()));
    } finally {
      setIsTriggering(false);
    }
  };

  const handleCreateDiscussionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discTitle.trim() || isCreatingDisc) return;

    try {
      setIsCreatingDisc(true);
      const createdTask = await api.createDiscussion({
        title: discTitle.trim(),
        description: discDescription.trim() || undefined,
        assigned_employee_ids: selectedEmpIds.length > 0 ? selectedEmpIds : undefined,
      });

      setDiscTitle("");
      setDiscDescription("");
      setSelectedEmpIds([]);
      setIsCreateDiscOpen(false);

      if (onRefreshTasks) {
        await onRefreshTasks();
      }

      if (createdTask && createdTask.id) {
        onSelectTask(createdTask.id);
      }
    } catch (err: any) {
      setErrorMessage("Gagal membuat diskusi baru: " + (err.message || err.toString()));
    } finally {
      setIsCreatingDisc(false);
    }
  };

  const handleQuickPreset = (titlePreset: string, descPreset: string) => {
    setDiscTitle(titlePreset);
    setDiscDescription(descPreset);
  };

  const handleApprove = async () => {
    if (!currentTask || isApproving) return;
    try {
      setIsApproving(true);
      await onApprovePlan(currentTask.id);
      onNavigate("progress");
    } catch (err: any) {
      setErrorMessage("Gagal menyetujui rencana kerja: " + (err.message || err.toString()));
    } finally {
      setIsApproving(false);
    }
  };

  if (!currentTask) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 shadow-sm space-y-3">
        <p>Belum ada tugas atau ruang diskusi aktif.</p>
        <button
          onClick={() => setIsCreateDiscOpen(true)}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Diskusi / Obrolan Baru</span>
        </button>
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
        {/* Task / Discussion Selector */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 shrink-0">
            <MessagesSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Pilih Ruang Rapat / Diskusi Aktif
            </label>
            <select
              value={currentTask.id}
              onChange={(e) => onSelectTask(e.target.value)}
              className="mt-0.5 block w-full max-w-sm sm:max-w-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 truncate cursor-pointer"
            >
              {activeMeetingTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.task_code}] {t.title} ({t.status})
                </option>
              ))}
            </select>
          </div>

          {/* Room Participants Status Chip */}
          {(() => {
            let assignedIds: string[] = [];
            if (currentTask.assigned_employee_ids_json) {
              try {
                assignedIds = JSON.parse(currentTask.assigned_employee_ids_json);
              } catch (e) {
                assignedIds = [];
              }
            }

            if (assignedIds.length === 1) {
              const emp = employees.find((e) => e.id === assignedIds[0]);
              return emp ? (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 shrink-0">
                  <img
                    src={emp.avatar_url}
                    alt={emp.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    👤 1-on-1: {emp.name} ({emp.role})
                  </span>
                </div>
              ) : null;
            }

            if (assignedIds.length > 1) {
              const assignedEmps = employees.filter((e) => assignedIds.includes(e.id));
              return (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-800 shrink-0">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {assignedEmps.map((emp) => (
                      <img
                        key={emp.id}
                        src={emp.avatar_url}
                        alt={emp.name}
                        title={`${emp.name} (${emp.role})`}
                        className="inline-block h-4 w-4 rounded-full ring-1 ring-white dark:ring-zinc-900 object-cover"
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                    👥 Tim ({assignedEmps.length} AI)
                  </span>
                </div>
              );
            }

            return (
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 shrink-0">
                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                  🌐 Pleno (7 AI)
                </span>
              </div>
            );
          })()}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsCreateDiscOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-600/30 cursor-pointer"
            title="Buat sesi diskusi atau obrolan bebas baru bersama tim AI"
          >
            <Plus className="w-4 h-4" />
            <span>+ Diskusi Baru</span>
          </button>

          <button
            disabled={isTriggering}
            onClick={handleTriggerDiscussion}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs border border-zinc-200 dark:border-zinc-700 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Panggil tim AI untuk berdiskusi secara otomatis"
          >
            {isTriggering ? (
              <Loader2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            )}
            <span>{isTriggering ? "Memicu..." : "Picu Diskusi Tim"}</span>
          </button>

          {currentTask.status === "MEETING" && (
            <button
              disabled={isApproving}
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isApproving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{isApproving ? "Menyetujui..." : "Setujui Rencana & Gas"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Context Card */}
      <div className="shrink-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 shadow-xs">
        <div className="truncate max-w-xl">
          <span className="font-bold text-red-600 dark:text-red-400">Topik / Arahan CEO: </span>
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
          messages.map((msg, index) => {
            const isCEO = msg.sender_type === "CEO";
            const uniqueKey = msg.id ? `msg-${msg.id}` : `temp-${index}`;
            return (
              <div
                key={uniqueKey}
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
      <form onSubmit={handleSendCEO} className="shrink-0 flex flex-col gap-1.5">
        <div className="flex gap-2 items-end">
          <textarea
            value={ceoInput}
            onChange={(e) => setCeoInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isSending && ceoInput.trim()) {
                  handleSendCEO(e);
                }
              }
            }}
            rows={2}
            placeholder="Ketik instruksi atau tanggapan CEO... (Tekan Enter untuk mengirim, Shift+Enter untuk paragraf baru)"
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition-colors shadow-xs resize-none"
          />
          <button
            type="submit"
            disabled={isSending || !ceoInput.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-600/30 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-[58px]"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{isSending ? "Mengirim..." : "Kirim Arahan"}</span>
          </button>
        </div>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 px-1">
          💡 Tips: Tekan <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-[9px] font-mono">Shift + Enter</kbd> untuk membuat paragraf baru.
        </span>
      </form>

      {/* Modal Buat Diskusi Baru */}
      <Modal
        isOpen={isCreateDiscOpen}
        onClose={() => setIsCreateDiscOpen(false)}
        title="Buat Sesi Diskusi / Obrolan Baru Tim AI"
      >
        <form onSubmit={handleCreateDiscussionSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-red-600" />
              Obrolan Bebas & Brainstorming Tim AI
            </p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Buat sesi diskusi baru di luar tugas resmi untuk ngobrol santai, membahas ide fitur, tanya jawab teknis, atau evaluasi arsitektur bersama 7 Karyawan AI.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Pilih Template Obrolan Cepat:</label>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: "💬 Diskusi Umum",
                  title: "Diskusi Umum & Ngobrol Santai Tim AI",
                  desc: "Halo tim, mari kita ngobrol santai dan evaluasi progres kerja kita sejauh ini.",
                },
                {
                  label: "💡 Brainstorming Ide",
                  title: "Brainstorming Ide & Fitur Baru",
                  desc: "Mari brainstorm ide-ide kreatif dan peningkatan fitur aplikasi ke depan.",
                },
                {
                  label: "🏗️ Review Arsitektur",
                  title: "Review System Design & Arsitektur",
                  desc: "Diskusi teknis mengenai optimasi struktur database, performa API, dan clean code.",
                },
                {
                  label: "⚡ Tanya Jawab Q&A",
                  title: "Tanya Jawab & Troubleshooting",
                  desc: "Sesi Q&A dan pemecahan kendala teknis bersama spesialis AI.",
                },
              ].map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickPreset(item.title, item.desc)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer font-medium"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Judul Topik / Obrolan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Brainstorming Optimasi Performa v2.0"
              value={discTitle}
              onChange={(e) => setDiscTitle(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Topik / Catatan Awal CEO (Opsional)
            </label>
            <textarea
              rows={3}
              placeholder="Tulis konteks atau pertanyaan awal yang ingin didiskusikan..."
              value={discDescription}
              onChange={(e) => setDiscDescription(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Pilih Anggota Diskusi (Assign Karyawan AI)
              </label>
              <button
                type="button"
                onClick={() => setSelectedEmpIds([])}
                className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                {selectedEmpIds.length === 0 ? "🌐 Semua Tim (Aktif)" : "Reset ke Semua Tim"}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
              Pilih 1 karyawan untuk <b>1-on-1 Direct</b>, atau 2-3 karyawan untuk <b>Diskusi Tim Tertentu</b>. Biarkan kosong jika ingin Pleno (semua 7 karyawan).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {employees.map((emp) => {
                const isSelected = selectedEmpIds.includes(emp.id);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedEmpIds(selectedEmpIds.filter((id) => id !== emp.id));
                      } else {
                        setSelectedEmpIds([...selectedEmpIds, emp.id]);
                      }
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-red-50 dark:bg-red-950/60 border-red-500 text-red-700 dark:text-red-300 shadow-xs"
                        : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    <img
                      src={emp.avatar_url}
                      alt={emp.name}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[11px] truncate leading-tight">{emp.name}</div>
                      <div className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate">{emp.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateDiscOpen(false)}
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCreatingDisc || !discTitle.trim()}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              {isCreatingDisc ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquarePlus className="w-4 h-4" />
              )}
              <span>{isCreatingDisc ? "Membuat..." : "Mulai Diskusi"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Error Modal */}
      <ErrorModal
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        message={errorMessage || ""}
      />
    </div>
  );
};
