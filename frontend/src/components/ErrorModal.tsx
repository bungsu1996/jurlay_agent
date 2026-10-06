import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = "Terjadi Kesalahan (API Error)",
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-red-500/40 rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-red-900/40 bg-red-950/30">
          <div className="flex items-center gap-2.5 text-red-400 font-semibold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 text-xs text-zinc-300 space-y-3">
          <p className="text-zinc-400 text-[11px]">
            Sistem mendeteksi kesalahan saat memproses permintaan API. Berikut detail respon error dari server:
          </p>
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-red-900/30 text-red-300 font-mono text-[11px] whitespace-pre-wrap break-words max-h-60 overflow-y-auto leading-relaxed">
            {message}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition-colors shadow-sm"
          >
            Tutup Dialog
          </button>
        </div>
      </div>
    </div>
  );
};
