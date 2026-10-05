import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Plus, X, RefreshCw, Play } from "lucide-react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { getSocket } from "../services/socket";
import { PageDocBanner } from "../components/PageDocBanner";
import { pageDocs } from "../data/pageDocs";

interface TabItem {
  id: string;
  name: string;
}

interface TerminalPaneProps {
  sessionId: string;
  name: string;
  isActive: boolean;
}

const TerminalPane: React.FC<TerminalPaneProps> = ({ sessionId, name, isActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      convertEol: true,
      fontFamily: "'JetBrains Mono', Menlo, Monaco, 'Courier New', monospace",
      theme: {
        background: "#09090b", // black zinc
        foreground: "#f4f4f5", // soft white
        cursor: "#ef4444", // vibrant red cursor
        selectionBackground: "#7f1d1d", // dark red selection
        black: "#18181b",
        red: "#ef4444",
        green: "#22c55e",
        yellow: "#eab308",
        blue: "#3b82f6",
        magenta: "#ec4899",
        cyan: "#06b6d4",
        white: "#fafafa",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(containerRef.current);
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    if (containerRef.current.offsetWidth > 0 && containerRef.current.offsetHeight > 0) {
      try {
        fitAddon.fit();
      } catch (e) {
        // ignore
      }
    }

    const socket = getSocket();
    socket.emit("terminal:init", { sessionId, name });

    const handleOutput = (data: string) => {
      term.write(data);
    };

    socket.on(`terminal:output:${sessionId}`, handleOutput);

    const onDataDisposable = term.onData((data: string) => {
      socket.emit("terminal:input", { sessionId, input: data });
    });

    const handleResize = () => {
      if (containerRef.current && containerRef.current.offsetWidth > 0) {
        try {
          fitAddon.fit();
        } catch (e) {}
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      onDataDisposable.dispose();
      socket.off(`terminal:output:${sessionId}`, handleOutput);
      term.dispose();
    };
  }, [sessionId]);

  useEffect(() => {
    if (isActive && fitAddonRef.current && containerRef.current) {
      const timer = setTimeout(() => {
        if (containerRef.current && containerRef.current.offsetWidth > 0 && containerRef.current.offsetHeight > 0) {
          try {
            fitAddonRef.current?.fit();
            termRef.current?.focus();
          } catch (e) {}
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full p-3 bg-[#09090b] ${isActive ? "block" : "hidden"}`}
      style={{ minHeight: "480px" }}
    />
  );
};

export const MultiTerminalPage: React.FC = () => {
  const [tabs, setTabs] = useState<TabItem[]>([
    { id: "term_1", name: "Terminal 1 (Utama)" },
    { id: "term_2", name: "Terminal 2 (Server & Log)" },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("term_1");

  const handleAddTab = () => {
    const newId = `term_${Date.now()}`;
    const newName = `Terminal ${tabs.length + 1}`;
    setTabs((prev) => [...prev, { id: newId, name: newName }]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) return;

    const socket = getSocket();
    socket.emit("terminal:close", { sessionId: tabId });

    const filtered = tabs.filter((t) => t.id !== tabId);
    setTabs(filtered);
    if (activeTabId === tabId) {
      setActiveTabId(filtered[0].id);
    }
  };

  const handleResetActiveTerminal = () => {
    const socket = getSocket();
    socket.emit("terminal:close", { sessionId: activeTabId });
    setTimeout(() => {
      socket.emit("terminal:init", { sessionId: activeTabId, name: activeTabId });
    }, 200);
  };

  const sendQuickCommand = (cmd: string) => {
    const socket = getSocket();
    socket.emit("terminal:input", { sessionId: activeTabId, input: `${cmd}\n` });
  };

  return (
    <div className="space-y-4">
      {/* Panduan Halaman Lengkap */}
      <PageDocBanner doc={pageDocs.terminals} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-600 text-white shadow-sm">
              <TerminalIcon className="w-5 h-5" />
            </span>
            <span>Multi-Terminal Workspace</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Akses langsung ke shell bawaan sistem (Bash / Command Prompt) dengan multi-sesi independen.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => sendQuickCommand("ls -la")}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 transition-all"
          >
            <Play className="w-3 h-3 text-red-600" />
            <span>ls -la</span>
          </button>
          <button
            onClick={() => sendQuickCommand("git status")}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 transition-all"
          >
            <Play className="w-3 h-3 text-red-600" />
            <span>git status</span>
          </button>
          <button
            onClick={() => sendQuickCommand("clear")}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 transition-all"
          >
            <span>clear</span>
          </button>
          <button
            onClick={handleResetActiveTerminal}
            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900 flex items-center gap-1.5 transition-all"
            title="Reset ulang sesi terminal yang aktif"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Shell</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Window Frame */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-300 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col">
        {/* Terminal Tab Bar */}
        <div className="flex items-center justify-between bg-zinc-900 border-b border-zinc-800 px-3 py-2">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? "bg-zinc-950 text-white border border-red-500/50 shadow-sm"
                      : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? "bg-red-500" : "bg-zinc-600"}`} />
                  <span className="truncate max-w-[140px]">{tab.name}</span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className="p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={handleAddTab}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-xs"
              title="Buka Tab Terminal Baru"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Window Traffic Lights */}
          <div className="flex items-center gap-1.5 pr-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
        </div>

        {/* Panes Container: Keeps all terminal instances alive and mounted */}
        <div className="relative flex-1 w-full bg-[#09090b] min-h-[480px]">
          {tabs.map((tab) => (
            <TerminalPane
              key={tab.id}
              sessionId={tab.id}
              name={tab.name}
              isActive={activeTabId === tab.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
