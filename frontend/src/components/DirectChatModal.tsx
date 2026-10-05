import React, { useState, useEffect, useRef } from "react";
import { Modal } from "./Modal";
import { Send, Bot, User, Sparkles, MessageSquare, Clock } from "lucide-react";
import { api } from "../services/api";
import { getSocket } from "../services/socket";

interface DirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any | null;
}

export const DirectChatModal: React.FC<DirectChatModalProps> = ({
  isOpen,
  onClose,
  employee,
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isOpen || !employee) return;

    loadMessages();

    const socket = getSocket();
    const handleNewMessage = (newMsg: any) => {
      setMessages((prev) => [...prev, newMsg]);
      setIsTyping(false);
      setTimeout(scrollToBottom, 50);
    };

    socket.on(`direct_message:${employee.id}`, handleNewMessage);

    return () => {
      socket.off(`direct_message:${employee.id}`, handleNewMessage);
    };
  }, [isOpen, employee?.id]);

  const loadMessages = async () => {
    if (!employee) return;
    try {
      setLoading(true);
      const data = await api.getEmployeeMessages(employee.id);
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Gagal load direct messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !employee) return;

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
    if (!employee) return [];
    switch (employee.role) {
      case "PM":
        return [
          "Breakdown tiket baru untuk tim",
          "Minta laporan status progres kerja",
          "Prioritaskan backlog sprint ini",
        ];
      case "BACKEND":
        return [
          "Bikinin rancangan API & tabel MySQL",
          "Cek performa query database",
          "Bikin skema autentikasi & middleware",
        ];
      case "FRONTEND":
        return [
          "Bikinin komponen UI dengan Tailwind",
          "Perbaiki tata letak agar ramah mobile",
          "Sesuaikan palet warna merah & abu-abu",
        ];
      case "QA":
        return [
          "Audit keamanan kode & sanitasi input",
          "Buatkan daftar skenario uji coba edge case",
        ];
      case "DEVOPS":
        return [
          "Periksa status port server & health check",
          "Verifikasi skrip launcher multiplatform",
        ];
      default:
        return [
          "Siap kerjakan task apa hari ini?",
          "Laporkan progres tugas terakhir",
        ];
    }
  };

  if (!employee) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col h-[560px] -mt-3">
        {/* Custom Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={employee.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${employee.name}`}
                alt={employee.name}
                className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{employee.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                  {employee.role}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                @{employee.profile_name} · <span className="text-emerald-600 dark:text-emerald-400 font-medium">Siap Berdiskusi</span>
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-xl my-3 border border-zinc-200/70 dark:border-zinc-800/70">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-zinc-400">
              Memuat percakapan...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-900/40">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Mulai Percakapan Pribadi dengan {employee.name}
              </h4>
              <p className="text-[11px] text-zinc-500 max-w-xs">
                Kirim instruksi, diskusikan fitur, atau minta solusi teknis langsung sesuai spesialisasinya.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isCEO = msg.sender === "CEO";
              return (
                <div
                  key={msg.id || idx}
                  className={`flex items-end gap-2 ${isCEO ? "justify-end" : "justify-start"}`}
                >
                  {!isCEO && (
                    <img
                      src={employee.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${employee.name}`}
                      alt={employee.name}
                      className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 p-0.5 shrink-0"
                    />
                  )}

                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isCEO
                        ? "bg-red-600 text-white rounded-br-xs shadow-md shadow-red-600/20"
                        : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 rounded-bl-xs border border-zinc-200 dark:border-zinc-800 shadow-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div
                      className={`text-[9px] mt-1.5 flex items-center gap-1 ${
                        isCEO ? "text-red-200 justify-end" : "text-zinc-400"
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <img
                src={employee.avatar_url}
                alt=""
                className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 p-0.5"
              />
              <div className="flex items-center gap-1 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {getQuickPrompts().map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] whitespace-nowrap border border-zinc-200 dark:border-zinc-800 transition-all shrink-0"
            >
              + {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Tulis instruksi atau tanya ke ${employee.name}...`}
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-all shadow-md shadow-red-600/30 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </Modal>
  );
};
