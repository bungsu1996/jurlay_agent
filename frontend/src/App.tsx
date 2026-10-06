import React, { useState, useEffect } from "react";
import { Sidebar, NavTab } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { Modal } from "./components/Modal";
import { SettingsModal } from "./components/SettingsModal";
import { DashboardPage } from "./pages/DashboardPage";
import { TaskBoardPage } from "./pages/TaskBoardPage";
import { MeetingRoomPage } from "./pages/MeetingRoomPage";
import { LiveProgressPage } from "./pages/LiveProgressPage";
import { TaskLogsPage } from "./pages/TaskLogsPage";
import { MultiTerminalPage } from "./pages/MultiTerminalPage";
import { GithubHubPage } from "./pages/GithubHubPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { TaskListPage } from "./pages/TaskListPage";
import { BottomChatDock } from "./components/BottomChatDock";
import { api } from "./services/api";
import { getSocket } from "./services/socket";
import { Sparkles, Flag, FolderGit2, Loader2 } from "lucide-react";
import { ErrorModal } from "./components/ErrorModal";

const VALID_TABS: NavTab[] = [
  "dashboard",
  "task-list",
  "tasks",
  "meetings",
  "progress",
  "logs",
  "terminals",
  "github",
  "employees",
];

export function App() {
  const getInitialTab = (): NavTab => {
    const hash = window.location.hash.replace("#", "") as NavTab;
    if (VALID_TABS.includes(hash)) return hash;
    const saved = localStorage.getItem("jurlay_active_tab") as NavTab;
    if (VALID_TABS.includes(saved)) return saved;
    return "dashboard";
  };

  const [currentTab, setCurrentTab] = useState<NavTab>(getInitialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [serverOnline, setServerOnline] = useState(true);

  // Settings State: Zoom UI Scale, Theme, Language
  const [uiScale, setUiScale] = useState<number>(() => {
    const saved = localStorage.getItem("jurlay_ui_scale");
    return saved ? parseFloat(saved) : 0.9; // Default 90% compact
  });

  const [language, setLanguage] = useState<"id" | "en">(() => {
    return (localStorage.getItem("jurlay_lang") as "id" | "en") || "id";
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("jurlay_theme") as "light" | "dark") || "light";
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("jurlay_theme", theme);
  }, [theme]);

  useEffect(() => {
    (document.documentElement.style as any).zoom = String(uiScale);
    localStorage.setItem("jurlay_ui_scale", String(uiScale));
  }, [uiScale]);

  useEffect(() => {
    localStorage.setItem("jurlay_lang", language);
  }, [language]);

  // Persist active tab across page refreshes via URL hash & localStorage
  useEffect(() => {
    window.location.hash = currentTab;
    localStorage.setItem("jurlay_active_tab", currentTab);
  }, [currentTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") as NavTab;
      if (VALID_TABS.includes(hash)) {
        setCurrentTab(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Cross-page selection state
  const [selectedMeetingTaskId, setSelectedMeetingTaskId] = useState<string | null>(null);
  const [selectedProgressTaskId, setSelectedProgressTaskId] = useState<string | null>(null);

  // Create Task Modal State
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskAssignedEmpIds, setTaskAssignedEmpIds] = useState<string[]>([]);

  // Bottom Floating Chat Dock State (Classic Facebook / Gmail Style)
  const [dockedChats, setDockedChats] = useState<{ employee: any; isMinimized: boolean }[]>([]);

  const handleOpenDockedChat = (emp: any) => {
    setDockedChats((prev) => {
      const existing = prev.find((c) => c.employee.id === emp.id);
      if (existing) {
        return prev.map((c) => (c.employee.id === emp.id ? { ...c, isMinimized: false } : c));
      }
      const updated = [...prev, { employee: emp, isMinimized: false }];
      if (updated.length > 3) {
        updated.shift();
      }
      return updated;
    });
  };

  const handleCloseDockedChat = (empId: string) => {
    setDockedChats((prev) => prev.filter((c) => c.employee.id !== empId));
  };

  const handleToggleMinimizeDockedChat = (empId: string) => {
    setDockedChats((prev) =>
      prev.map((c) => (c.employee.id === empId ? { ...c, isMinimized: !c.isMinimized } : c))
    );
  };
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskProjectId, setTaskProjectId] = useState<string>("");
  const [projectRootPath, setProjectRootPath] = useState<string>("");
  const [loadingCreateTask, setLoadingCreateTask] = useState(false);

  useEffect(() => {
    loadAllData();

    const socket = getSocket();

    socket.on("connect", () => setServerOnline(true));
    socket.on("disconnect", () => setServerOnline(false));

    socket.on("task:created", (newTask: any) => {
      setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)]);
    });

    socket.on("task:updated", (updatedTask: any) => {
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)));
    });

    socket.on("employee:status_changed", (data: { employeeId: string; status: string }) => {
      setEmployees((prev) =>
        prev.map((e) => (e.id === data.employeeId ? { ...e, status: data.status } : e))
      );
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("task:created");
      socket.off("task:updated");
      socket.off("employee:status_changed");
    };
  }, []);

  const loadAllData = async () => {
    try {
      const [tList, eList, pList] = await Promise.all([
        api.getTasks(),
        api.getEmployees(),
        api.getProjects(),
      ]);
      setTasks(tList || []);
      setEmployees(eList || []);
      setProjects(pList || []);
      if (pList && pList.length > 0 && !taskProjectId) {
        setTaskProjectId(pList[0].id);
      }
    } catch (err) {
      console.error("Gagal memuat data awal:", err);
      setServerOnline(false);
    }
  };

  const [appError, setAppError] = useState<string | null>(null);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDescription || loadingCreateTask) return;

    try {
      setLoadingCreateTask(true);
      const created = await api.createTask({
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        github_project_id: taskProjectId || undefined,
        project_root_path: projectRootPath || undefined,
        assigned_employee_ids: taskAssignedEmpIds.length > 0 ? taskAssignedEmpIds : undefined,
      });

      setIsCreateTaskOpen(false);
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("MEDIUM");
      setProjectRootPath("");
      setTaskAssignedEmpIds([]);
      await loadAllData();

      // Navigate to task board
      setSelectedMeetingTaskId(created.id);
      setCurrentTab("tasks");
    } catch (err: any) {
      setAppError("Gagal membuat tugas baru: " + (err.message || err.toString()));
    } finally {
      setLoadingCreateTask(false);
    }
  };

  const handleStartMeeting = async (taskId: string) => {
    await api.startMeeting(taskId);
    await loadAllData();
  };

  const handleApprovePlan = async (taskId: string) => {
    await api.approvePlan(taskId);
    await loadAllData();
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    await api.updateTaskStatus(taskId, status);
    await loadAllData();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col antialiased transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        activeMeetingCount={tasks.filter((t) => t.status === "MEETING").length}
        activeTaskCount={tasks.filter((t) => t.status !== "DONE").length}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col lg:pl-60 transition-all duration-300">
        <Navbar
          currentTab={currentTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          serverOnline={serverOnline}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setIsSettingsOpen(true)}
          uiScale={uiScale}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 w-full">
          {currentTab === "dashboard" && (
            <DashboardPage
              employees={employees}
              tasks={tasks}
              projects={projects}
              onNavigate={setCurrentTab}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
            />
          )}

          {currentTab === "task-list" && (
            <TaskListPage
              onNavigate={setCurrentTab}
              onRefreshData={loadAllData}
            />
          )}

          {currentTab === "tasks" && (
            <TaskBoardPage
              tasks={tasks}
              projects={projects}
              employees={employees}
              onStartMeeting={handleStartMeeting}
              onApprovePlan={handleApprovePlan}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onNavigate={setCurrentTab}
              onSelectTaskForMeeting={setSelectedMeetingTaskId}
              onSelectTaskForProgress={setSelectedProgressTaskId}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
            />
          )}

          {currentTab === "meetings" && (
            <MeetingRoomPage
              tasks={tasks}
              selectedTaskId={selectedMeetingTaskId}
              onSelectTask={setSelectedMeetingTaskId}
              onApprovePlan={handleApprovePlan}
              onNavigate={setCurrentTab}
              onRefreshTasks={loadAllData}
            />
          )}

          {currentTab === "progress" && (
            <LiveProgressPage
              tasks={tasks}
              selectedTaskId={selectedProgressTaskId}
              onSelectTask={setSelectedProgressTaskId}
            />
          )}

          {currentTab === "logs" && (
            <TaskLogsPage
              tasks={tasks}
              selectedTaskId={selectedProgressTaskId}
              onSelectTask={setSelectedProgressTaskId}
            />
          )}

          {currentTab === "terminals" && <MultiTerminalPage />}

          {currentTab === "github" && (
            <GithubHubPage
              projects={projects}
              onRefreshProjects={loadAllData}
            />
          )}

          {currentTab === "employees" && (
            <EmployeesPage
              employees={employees}
              onRefreshEmployees={loadAllData}
              onOpenChat={handleOpenDockedChat}
            />
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        uiScale={uiScale}
        onSelectScale={(scale) => setUiScale(scale)}
        theme={theme}
        onToggleTheme={(t) => setTheme(t)}
        language={language}
        onSelectLanguage={(l) => setLanguage(l)}
      />

      {/* Global Modal: Beri Mandat / Create Task */}
      <Modal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        title="Beri Mandat Tugas Baru (CEO)"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Judul Tugas / Fitur
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Contoh: Buat Fitur Autentikasi JWT dan Halaman Login"
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Deskripsi Lengkap & Persyaratan Teknis
            </label>
            <textarea
              required
              rows={4}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Jelaskan kebutuhan fitur sedetail mungkin. Misal: butuh schema table user di mysql, endpoint login & register, serta form react responsive dengan validasi..."
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none leading-relaxed transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Root Path Project (Opsional Spesiﬁk Path)
            </label>
            <input
              type="text"
              placeholder="Contoh: C:\WorkSpace\Rumah\jurlay-agent"
              value={projectRootPath}
              onChange={(e) => setProjectRootPath(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Tingkat Prioritas
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none transition-colors"
              >
                <option value="LOW">Low (Rendah)</option>
                <option value="MEDIUM">Medium (Standar)</option>
                <option value="HIGH">High (Tinggi)</option>
                <option value="URGENT">Urgent (Prioritas Utama)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Target Workspace
              </label>
              <select
                value={taskProjectId}
                onChange={(e) => setTaskProjectId(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none transition-colors"
              >
                <option value="">Pilih Workspace...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Penugasan Karyawan AI (Opsional 1-on-1 / Tim Spesifik)
              </label>
              <button
                type="button"
                onClick={() => setTaskAssignedEmpIds([])}
                className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                {taskAssignedEmpIds.length === 0 ? "🌐 Semua Tim AI" : "Reset ke Semua Tim"}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {employees.map((emp) => {
                const isSelected = taskAssignedEmpIds.includes(emp.id);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setTaskAssignedEmpIds(taskAssignedEmpIds.filter((id) => id !== emp.id));
                      } else {
                        setTaskAssignedEmpIds([...taskAssignedEmpIds, emp.id]);
                      }
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-red-50 dark:bg-red-950/60 border-red-500 text-red-700 dark:text-red-300 shadow-xs"
                        : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    <img
                      src={emp.avatar_url}
                      alt={emp.name}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[10px] truncate leading-tight">{emp.name}</div>
                      <div className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate">{emp.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-700 dark:text-red-300">Alur Delegasi Otomatis: </span>
              Tugas ini akan otomatis diberi kode unik (misal <span className="font-mono text-red-600 dark:text-red-400 font-bold">TASK-XXX</span>) dan di-assign ke <strong>Lead PM Arya</strong> untuk dibawa ke ruang meeting tim.
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateTaskOpen(false)}
              className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loadingCreateTask}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md shadow-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingCreateTask ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mendelegasikan...</span>
                </>
              ) : (
                "Kirim Mandat ke Tim AI"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Persistent Bottom Floating Chat Dock (Facebook / Gmail style) */}
      <BottomChatDock
        dockedChats={dockedChats}
        onCloseChat={handleCloseDockedChat}
        onToggleMinimize={handleToggleMinimizeDockedChat}
        onOpenChat={handleOpenDockedChat}
        allEmployees={employees}
      />

      {/* App Global Error Modal */}
      <ErrorModal
        isOpen={!!appError}
        onClose={() => setAppError(null)}
        message={appError || ""}
      />
    </div>
  );
}
export default App;
