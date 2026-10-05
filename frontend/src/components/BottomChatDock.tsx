import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  X,
  Minus,
  Maximize2,
  Users,
  MessageSquare,
  Bot,
  Clock,
  ChevronUp,
} from "lucide-react";
import { api } from "../services/api";
import { getSocket } from "../services/socket";

interface DockedEmployeeChat {
  employee: any;
  isMinimized: boolean;
}

interface BottomChatDockProps {
  dockedChats: DockedEmployeeChat[];
  onCloseChat: (employeeId: string) => void;
  onToggleMinimize: (employeeId: string) => void;
  onOpenChat: (employee: any) => void;
  allEmployees: any[];
}

interface SingleChatBoxProps {
  employee: any;
  isMinimized: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
}

const SingleChatBox: React.FC<SingleChatBoxProps> = ({
  employee,
  isMinimized,
  onClose,
  onToggleMinimize,
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadMessages();

    const socket = getSocket();
    const handleNewMessage = (newMsg: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setIsTyping(false);
      setTimeout(scrollToBottom, 50);
    };

    const handleTyping = (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping);
      setTimeout(scrollToBottom, 50);
    };

    socket.on(`direct_message:${employee.id}`, handleNewMessage);
    socket.on(`direct_message:typing:${employee.id}`, handleTyping);

    return () => {
      socket.off(`direct_message:${employee.id}`, handleNewMessage);
      socket.off(`direct_message:typing:${employee.id}`, handleTyping);
    };
  }, [employee.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await api.getEmployeeMessages(employee.id);
      setMessages(data || []);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Gagal load pesan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setInputText("");
    setIsTyping(true);

    try {
      await api.sendEmployeeMessage(employee.id, text);
    } catch (err: any) {
      setIsTyping(false);
      alert("Gagal mengirim pesan: " + err.message);
    }
  };

  const getQuickPrompts = () => {
    switch (employee.role) {
      case "PM":
        return ["Breakdown tugas sprint ini", "Minta laporan status progres", "Prioritaskan backlog"];
      case "BACKEND":
        return ["Rancang API & tabel MySQL", "Cek performa query database", "Bikin skema autentikasi"];
      case "FRONTEND":
        return ["Bikinin komponen Tailwind", "Perbaiki responsivitas mobile", "Atur palet warna merah"];
      case "QA":
        return ["Audit keamanan & sanitasi shell", "Buat skenario test case"];
      case "DEVOPS":
        return ["Cek port & runner script", "Verifikasi kesehatan server"];
      default:
        return ["Siap eksekusi apa hari ini?", "Laporkan hasil kerja"];
    }
  };

  return (
    <div
      className={`w-72 sm:w-80 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-t-2xl shadow-2xl flex flex-col transition-all duration-200 overflow-hidden ${
        isMinimized ? "h-11" : "h-[420px]"
      }`}
    >
      {/* Header Bar */}
      <div
        onClick={onToggleMinimize}
        className="flex items-center justify-between px-3 py-2 bg-zinc-900 text-white cursor-pointer select-none border-b border-zinc-800 shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <img
              src={employee.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${employee.name}`}
              alt={employee.name}
              className="w-7 h-7 rounded-lg bg-zinc-800 p-0.5 border border-zinc-700"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-zinc-900" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              <span>{employee.name}</span>
            </div>
            <span className="text-[9px] font-bold text-red-400 block -mt-0.5">
              {employee.role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleMinimize}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title={isMinimized ? "Perbesar Chat" : "Kecilkan Chat"}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-red-600 text-zinc-400 hover:text-white transition-colors"
            title="Tutup Chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Chat Content */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-950">
          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[11px] text-zinc-400">
                Memuat pesan...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-1.5 text-zinc-400">
                <MessageSquare className="w-6 h-6 text-red-500 opacity-60" />
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  Mulai percakapan dengan {employee.name}. Tanya atau instruksikan apa saja langsung ke AI!
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isCEO = msg.sender === "CEO";
                return (
                  <div
                    key={msg.id || idx}
                    className={`flex items-end gap-1.5 ${isCEO ? "justify-end" : "justify-start"}`}
                  >
                    {!isCEO && (
                      <img
                        src={employee.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${employee.name}`}
                        alt=""
                        className="w-5 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800 p-0.5 shrink-0"
                      />
                    )}

                    <div
                      className={`max-w-[80%] p-2.5 rounded-2xl leading-relaxed text-[11px] ${
                        isCEO
                          ? "bg-red-600 text-white rounded-br-xs shadow-xs"
                          : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-bl-xs border border-zinc-200 dark:border-zinc-800 shadow-xs"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div
                        className={`text-[8px] mt-1 text-right ${
                          isCEO ? "text-red-200" : "text-zinc-400"
                        }`}
                      >
                        {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 pt-1">
                <img
                  src={employee.avatar_url}
                  alt=""
                  className="w-5 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800 p-0.5"
                />
                <div className="flex items-center gap-1 p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[10px] text-zinc-400 italic font-mono">9router combogravuty...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-1 overflow-x-auto px-2 py-1 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 scrollbar-none shrink-0">
            {getQuickPrompts().map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(p)}
                className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[9px] font-medium whitespace-nowrap border border-zinc-200 dark:border-zinc-700 shrink-0"
              >
                + {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-1.5 p-2 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Tanya ${employee.name}...`}
              className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 transition-all shadow-xs shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export const BottomChatDock: React.FC<BottomChatDockProps> = ({
  dockedChats,
  onCloseChat,
  onToggleMinimize,
  onOpenChat,
  allEmployees,
}) => {
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const contactsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        isContactsOpen &&
        contactsContainerRef.current &&
        !contactsContainerRef.current.contains(e.target as Node)
      ) {
        setIsContactsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isContactsOpen]);

  return (
    <div className="fixed bottom-0 right-3 sm:right-6 z-50 flex items-end gap-2.5 pointer-events-none">
      {/* Floating Active Chat Boxes */}
      <div className="flex items-end gap-2.5 pointer-events-auto">
        {dockedChats.map(({ employee, isMinimized }) => (
          <SingleChatBox
            key={employee.id}
            employee={employee}
            isMinimized={isMinimized}
            onClose={() => onCloseChat(employee.id)}
            onToggleMinimize={() => onToggleMinimize(employee.id)}
          />
        ))}
      </div>

      {/* Floating Team Contacts Menu Launcher (Bottom Right) */}
      <div ref={contactsContainerRef} className="relative pointer-events-auto">
        {isContactsOpen && (
          <div className="absolute bottom-12 right-0 w-64 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden mb-1 flex flex-col max-h-80">
            <div className="p-2.5 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold">Karyawan AI JURLAY</span>
              </div>
              <button
                onClick={() => setIsContactsOpen(false)}
                className="p-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-y-auto p-1.5 space-y-1">
              {allEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => {
                    onOpenChat(emp);
                    setIsContactsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <div className="relative shrink-0">
                    <img
                      src={emp.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${emp.name}`}
                      alt=""
                      className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 p-0.5"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-zinc-900" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {emp.name}
                    </div>
                    <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold truncate">
                      {emp.role} · @{emp.profile_name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dock Launcher Button */}
        <button
          onClick={() => setIsContactsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-t-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xl transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Chat Tim AI</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono">
            {allEmployees.length}
          </span>
          <ChevronUp
            className={`w-3.5 h-3.5 transition-transform ${isContactsOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </div>
  );
};
