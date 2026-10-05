import React from "react";
import { Modal } from "./Modal";
import { Sliders, Globe, Palette, Check, Sparkles, Monitor } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiScale: number;
  onSelectScale: (scale: number) => void;
  theme: "light" | "dark";
  onToggleTheme: (t: "light" | "dark") => void;
  language: "id" | "en";
  onSelectLanguage: (lang: "id" | "en") => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  uiScale,
  onSelectScale,
  theme,
  onToggleTheme,
  language,
  onSelectLanguage,
}) => {
  const scaleOptions = [
    { value: 0.8, label: "80%", desc: "Sangat Kompak (Banyak info muat)" },
    { value: 0.85, label: "85%", desc: "Kompak Ringkas" },
    { value: 0.9, label: "90%", desc: "Nyaman (Rekomendasi Default)" },
    { value: 1.0, label: "100%", desc: "Standar Normal" },
    { value: 1.1, label: "110%", desc: "Besar & Lapang" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pengaturan Antarmuka JURLAY AGENT" maxWidth="max-w-lg">
      <div className="space-y-6 text-zinc-800 dark:text-zinc-200">
        {/* 1. Pengaturan Skala Ukuran Tampilan */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sliders className="w-4 h-4 text-red-600 dark:text-red-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Skala Ukuran Tampilan (Zoom / Kerapatan UI)
            </h4>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            Atur kepadatan layout agar ukuran font, tombol, dan kartu sesuai kenyamanan mata layar Anda.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {scaleOptions.map((opt) => {
              const isSelected = Math.abs(uiScale - opt.value) < 0.01;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectScale(opt.value)}
                  className={`flex items-start justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-300 font-semibold shadow-sm"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{opt.desc}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Pengaturan Tema Warna */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4 text-red-600 dark:text-red-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Tema Tampilan Warna
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onToggleTheme("light")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                theme === "light"
                  ? "bg-red-50 border-red-500 text-red-700 font-bold shadow-sm"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-300 flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-red-600" />
              </div>
              <div className="text-xs">Mode Terang (Putih / Abu-abu / Aksen Merah)</div>
            </button>

            <button
              type="button"
              onClick={() => onToggleTheme("dark")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                theme === "dark"
                  ? "bg-red-950/40 border-red-500 text-red-400 font-bold shadow-sm"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500" />
              </div>
              <div className="text-xs">Mode Gelap (Hitam / Abu-abu Zinc / Aksen Merah)</div>
            </button>
          </div>
        </div>

        {/* 3. Pengaturan Bahasa */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-red-600 dark:text-red-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Bahasa Antarmuka
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSelectLanguage("id")}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
                language === "id"
                  ? "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-300 font-bold shadow-sm"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span>🇮🇩 Bahasa Indonesia (Default)</span>
              {language === "id" && <Check className="w-4 h-4 text-red-600 dark:text-red-400" />}
            </button>

            <button
              type="button"
              onClick={() => onSelectLanguage("en")}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
                language === "en"
                  ? "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-300 font-bold shadow-sm"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span>🇬🇧 English</span>
              {language === "en" && <Check className="w-4 h-4 text-red-600 dark:text-red-400" />}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all"
          >
            Selesai & Simpan
          </button>
        </div>
      </div>
    </Modal>
  );
};
