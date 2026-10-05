import React, { useState } from "react";
import { BookOpen, Info, CheckCircle2, ChevronRight, X, Sparkles } from "lucide-react";
import { Modal } from "./Modal";

export interface PageDocContent {
  title: string;
  tagline: string;
  summary: string;
  keyFeatures: { title: string; desc: string }[];
  workflowSteps: { step: string; title: string; desc: string }[];
  tips?: string[];
}

interface PageDocBannerProps {
  doc: PageDocContent;
}

export const PageDocBanner: React.FC<PageDocBannerProps> = ({ doc }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Slim Modern Header Banner */}
      <div className="mb-4 bg-gradient-to-r from-red-500/10 via-zinc-100 to-zinc-50 dark:from-red-950/30 dark:via-zinc-900/60 dark:to-zinc-900/40 border border-red-200/80 dark:border-red-900/40 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate">
              <span>{doc.title}</span>
              <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                — {doc.tagline}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-red-600 dark:text-red-400 dark:hover:text-white border border-red-200 dark:border-zinc-700 hover:border-transparent text-[11px] font-bold transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <BookOpen className="w-3 h-3" />
          <span>Panduan Lengkap</span>
        </button>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Panduan Halaman: ${doc.title}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-xs leading-relaxed">
          {/* Ringkasan */}
          <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
            <h4 className="text-xs font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Tentang Halaman Ini
            </h4>
            <p className="text-zinc-700 dark:text-zinc-300 text-[11px] leading-relaxed">
              {doc.summary}
            </p>
          </div>

          {/* Fitur & Komponen Utama */}
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-2 uppercase tracking-wider text-[10px]">
              Fitur & Elemen Utama di Halaman Ini
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {doc.keyFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px] flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3 h-3 text-red-600 dark:text-red-400 shrink-0" />
                    <span>{feat.title}</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-normal pl-4.5">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Alur Kerja / Step by Step Workflow */}
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-2 uppercase tracking-wider text-[10px]">
              Alur Kerja Penggunaan (Step-by-Step)
            </h4>
            <div className="space-y-1.5">
              {doc.workflowSteps.map((wf, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80"
                >
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    {wf.step}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">
                      {wf.title}
                    </div>
                    <div className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                      {wf.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips Praktis */}
          {doc.tips && doc.tips.length > 0 && (
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px] mb-1.5">
                💡 Tips Praktis untuk CEO:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-[10px] text-zinc-600 dark:text-zinc-400">
                {doc.tips.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer Tutup */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
