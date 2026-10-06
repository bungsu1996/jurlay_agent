import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Bot,
  Wrench,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Loader2,
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { DirectChatModal } from "../components/DirectChatModal";
import { PageDocBanner } from "../components/PageDocBanner";
import { pageDocs } from "../data/pageDocs";
import { ErrorModal } from "../components/ErrorModal";

interface EmployeesPageProps {
  employees: any[];
  onRefreshEmployees: () => void;
  onOpenChat?: (employee: any) => void;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({
  employees,
  onRefreshEmployees,
  onOpenChat,
}) => {
  const [isHireOpen, setIsHireOpen] = useState(false);
  const [selectedChatEmployee, setSelectedChatEmployee] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("BACKEND");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [allowedTools, setAllowedTools] = useState<string[]>([
    "read_file",
    "write_file",
    "terminal",
  ]);
  const [loadingHire, setLoadingHire] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableTools = [
    { id: "read_file", label: "Read Files" },
    { id: "write_file", label: "Write Files" },
    { id: "patch", label: "Patch Files" },
    { id: "terminal", label: "Run Terminal" },
    { id: "search_files", label: "Search Files" },
    { id: "web_search", label: "Web Search" },
  ];

  const handleToggleTool = (toolId: string) => {
    setAllowedTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  };

  const handleHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !systemPrompt || loadingHire) return;

    try {
      setLoadingHire(true);
      await api.createEmployee({
        name,
        role,
        system_prompt: systemPrompt,
        allowed_tools: allowedTools,
      });
      setIsHireOpen(false);
      setName("");
      setSystemPrompt("");
      onRefreshEmployees();
    } catch (err: any) {
      setErrorMessage("Gagal merekrut karyawan AI: " + (err.message || err.toString()));
    } finally {
      setLoadingHire(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Panduan Halaman Lengkap */}
      <PageDocBanner doc={pageDocs.employees} />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-600 text-white shadow-sm">
              <Users className="w-5 h-5" />
            </span>
            <span>Struktur Karyawan & Chat Tim AI</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Daftar karyawan AI JURLAY AGENT. Anda bisa langsung chat 1-on-1 dengan tiap personil atau hire personil baru.
          </p>
        </div>

        <button
          onClick={() => setIsHireOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-600/30 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Hire Karyawan AI</span>
        </button>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-400/60 dark:hover:border-red-900/60 transition-all flex flex-col justify-between space-y-3.5 shadow-sm group"
          >
            <div>
              {/* Profile Header */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={emp.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${emp.name}`}
                      alt={emp.name}
                      className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700"
                    />
                    <span
                      title={emp.is_online !== false ? "Karyawan Online" : "Karyawan Offline"}
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                        emp.is_online !== false ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{emp.name}</h3>
                      <button
                        type="button"
                        disabled={togglingId === emp.id}
                        onClick={async () => {
                          try {
                            setTogglingId(emp.id);
                            await api.updateEmployee(emp.id, { is_online: emp.is_online === false });
                            onRefreshEmployees();
                          } catch (err: any) {
                            setErrorMessage("Gagal mengubah status karyawan: " + (err.message || err.toString()));
                          } finally {
                            setTogglingId(null);
                          }
                        }}
                        title="Klik untuk ubah status Online/Offline"
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border transition-all inline-flex items-center gap-1 disabled:opacity-50 ${
                          emp.is_online !== false
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        {togglingId === emp.id ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : null}
                        <span>{emp.is_online !== false ? "● Online" : "○ Offline"}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-bold text-red-600 dark:text-red-400">{emp.role}</span>
                      <span className="text-zinc-400 text-xs">·</span>
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">@{emp.profile_name}</span>
                    </div>
                  </div>
                </div>

                <StatusBadge status={emp.status} type="employee" />
              </div>

              {/* Persona / System Prompt Snippet */}
              <div className="mt-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed max-h-24 overflow-y-auto">
                <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                  <Bot className="w-3 h-3 text-red-500" />
                  <span>Persona & Tanggung Jawab</span>
                </div>
                {emp.system_prompt}
              </div>

              {/* Tools Privileges */}
              <div className="mt-3 space-y-1">
                <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-zinc-500" />
                  <span>Izin Akses Tools</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(emp.allowed_tools || []).map((t: string) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar: Chat Button + Profile Ready */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Hermes Profile Aktif</span>
              </span>

              {/* Button Chat Personal 1-on-1 */}
              <button
                type="button"
                onClick={() => (onOpenChat ? onOpenChat(emp) : setSelectedChatEmployee(emp))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-950/40 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white text-xs font-bold border border-red-200 dark:border-red-900/60 transition-all shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat Personal</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Direct Chat Modal */}
      {selectedChatEmployee && (
        <DirectChatModal
          isOpen={!!selectedChatEmployee}
          onClose={() => setSelectedChatEmployee(null)}
          employee={selectedChatEmployee}
        />
      )}

      {/* Hire Modal */}
      <Modal
        isOpen={isHireOpen}
        onClose={() => setIsHireOpen(false)}
        title="Rekrut Karyawan AI Baru"
      >
        <form onSubmit={handleHireSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nama Lengkap Karyawan AI
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Gilang Mobile Specialist"
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Role & Spesialisasi
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value="PM">Project Manager (PM)</option>
              <option value="BACKEND">Backend Developer</option>
              <option value="FRONTEND">Frontend Engineer</option>
              <option value="QA">QA & Security Auditor</option>
              <option value="DEVOPS">DevOps & Cloud Engineer</option>
              <option value="RESEARCHER">AI Researcher</option>
              <option value="CUSTOM">Spesialis Khusus (Custom)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              System Prompt (Persona, Keahlian & Standar Kualitas)
            </label>
            <textarea
              required
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Jelaskan peran, cara kerja, dan aturan spesifik bagi karyawan ini saat mengeksekusi tugas..."
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Hak Akses Tools
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableTools.map((tool) => {
                const isChecked = allowedTools.includes(tool.id);
                return (
                  <button
                    type="button"
                    key={tool.id}
                    onClick={() => handleToggleTool(tool.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs text-left transition-all ${
                      isChecked
                        ? "bg-red-50 dark:bg-red-950/40 border-red-400 text-red-700 dark:text-red-300 font-semibold"
                        : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        isChecked ? "text-red-600 dark:text-red-400" : "text-zinc-400"
                      }`}
                    />
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsHireOpen(false)}
              className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loadingHire}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingHire ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                "Rekrut Karyawan"
              )}
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
