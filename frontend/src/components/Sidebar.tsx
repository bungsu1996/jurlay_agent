import React from "react";
import {
  LayoutDashboard,
  KanbanSquare,
  MessagesSquare,
  Activity,
  Terminal,
  GitBranch,
  Users,
  Sparkles,
} from "lucide-react";

export type NavTab = "dashboard" | "tasks" | "meetings" | "progress" | "terminals" | "github" | "employees";

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeMeetingCount?: number;
  activeTaskCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  setIsOpen,
  activeMeetingCount = 0,
  activeTaskCount = 0,
}) => {
  const menuItems = [
    {
      id: "dashboard" as NavTab,
      label: "Ringkasan Kantor",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "tasks" as NavTab,
      label: "Papan Tugas",
      icon: KanbanSquare,
      badge: activeTaskCount > 0 ? activeTaskCount : null,
      badgeColor: "bg-red-600 text-white",
    },
    {
      id: "meetings" as NavTab,
      label: "Ruang Diskusi",
      icon: MessagesSquare,
      badge: activeMeetingCount > 0 ? "LIVE" : null,
      badgeColor: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-900",
    },
    {
      id: "progress" as NavTab,
      label: "Progres Langsung",
      icon: Activity,
      badge: null,
    },
    {
      id: "terminals" as NavTab,
      label: "Multi-Terminal",
      icon: Terminal,
      badge: "Shell",
      badgeColor: "bg-zinc-800 text-zinc-300 border border-zinc-700",
    },
    {
      id: "github" as NavTab,
      label: "Repositori GitHub",
      icon: GitBranch,
      badge: null,
    },
    {
      id: "employees" as NavTab,
      label: "Karyawan & Tim AI",
      icon: Users,
      badge: null,
    },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-60 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-sm ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-md shadow-red-600/30 shrink-0">
            <span className="text-white font-black text-lg tracking-wider">J</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5 truncate">
              JURLAY AGENT
            </h1>
            <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              Perusahaan AI Mandiri
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
          <div className="px-2.5 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Menu Navigasi
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group text-left ${
                  isActive
                    ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? "text-red-600 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                    }`}
                  />
                  <span className="truncate text-left">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md shrink-0 ml-1 ${
                      item.badgeColor || "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User / CEO Info Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 shadow-xs">
            <img
              src="https://api.dicebear.com/7.x/bottts/svg?seed=NyonsCEO&backgroundColor=dc2626"
              alt="CEO"
              className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950 p-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">Nyons</div>
              <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold truncate">Founder & CEO</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
