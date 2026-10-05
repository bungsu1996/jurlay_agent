import React from "react";
import { Menu, Sun, Moon, Settings, Sparkles, Activity } from "lucide-react";
import { NavTab } from "./Sidebar";

interface NavbarProps {
  currentTab: NavTab;
  onOpenSidebar: () => void;
  serverOnline?: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  uiScale: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenSidebar,
  serverOnline = true,
  theme,
  onToggleTheme,
  onOpenSettings,
  uiScale,
}) => {
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case "dashboard":
        return "Ringkasan Kantor (Dashboard)";
      case "tasks":
        return "Papan Tugas (Kanban)";
      case "meetings":
        return "Ruang Diskusi (Meeting AI)";
      case "progress":
        return "Progres Eksekusi Langsung";
      case "terminals":
        return "Multi-Terminal Web Shell";
      case "github":
        return "Repositori GitHub Hub";
      case "employees":
        return "Karyawan & Chat Tim AI";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-3 sm:px-5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 -ml-1 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>{getTabTitle(currentTab)}</span>
          </h2>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 hidden sm:block font-medium">
            JURLAY AGENT · Sistem Perusahaan AI Mandiri
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Status Server */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs border border-zinc-200 dark:border-zinc-700 font-medium">
          <span className={`w-2 h-2 rounded-full ${serverOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          <span>{serverOnline ? "Sistem Aktif" : "Terputus"}</span>
        </div>

        {/* Indikator Skala Tampilan */}
        <button
          onClick={onOpenSettings}
          className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono border border-zinc-200 dark:border-zinc-700 hover:border-red-400 transition-all"
          title="Klik untuk atur ukuran tampilan"
        >
          <span className="text-[10px] text-zinc-400">Zoom:</span>
          <span className="font-bold text-red-600 dark:text-red-400">{Math.round(uiScale * 100)}%</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-all flex items-center gap-1 text-xs font-semibold"
          title={theme === "light" ? "Ganti ke Mode Gelap" : "Ganti ke Mode Terang"}
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4 text-zinc-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Settings Modal Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 hover:border-red-500 transition-all"
          title="Buka Pengaturan"
        >
          <Settings className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>

        {/* Version Badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold shadow-sm shadow-red-600/20">
          <span>v1.2.0</span>
        </div>
      </div>
    </header>
  );
};
