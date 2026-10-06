import React, { useState, useEffect } from "react";
import {
  ListTodo,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  Lock,
  ChevronDown,
  ChevronUp,
  MessagesSquare,
  FileText,
  UserCheck,
  FolderCode,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { api } from "../services/api";
import { NavTab } from "../components/Sidebar";
import { ErrorModal } from "../components/ErrorModal";

interface TaskListPageProps {
  onNavigate: (tab: NavTab) => void;
  onRefreshData?: () => void;
}

export const TaskListPage: React.FC<TaskListPageProps> = ({
  onNavigate,
  onRefreshData,
}) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Selected task detail view
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Subtask Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubTask, setEditingSubTask] = useState<any | null>(null);
  const [subTaskTitle, setSubTaskTitle] = useState("");
  const [subTaskDesc, setSubTaskDesc] = useState("");
  const [subTaskEmployeeId, setSubTaskEmployeeId] = useState("");
  const [subTaskStatus, setSubTaskStatus] = useState("TODO");
  const [subTaskOrder, setSubTaskOrder] = useState(0);

  // Subtask Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingSubTaskId, setDeletingSubTaskId] = useState<string | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [tasksRes, empRes] = await Promise.all([
        api.getTasks(),
        api.getEmployees(),
      ]);
      setTasks(tasksRes || []);
      setEmployees(empRes || []);

      // Refresh selectedTask if open
      if (selectedTask) {
        const updatedSelected = (tasksRes || []).find((t: any) => t.id === selectedTask.id);
        if (updatedSelected) {
          setSelectedTask(updatedSelected);
        }
      }
    } catch (err: any) {
      setErrorMessage("Gagal memuat daftar task: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.task_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || task.status === statusFilter;

    const matchesType =
      typeFilter === "ALL"
        ? true
        : typeFilter === "DISCUSSIONS"
        ? task.task_code.startsWith("DISC-")
        : !task.task_code.startsWith("DISC-");

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate summary stats
  const totalTasksCount = tasks.length;
  const activeTasksCount = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "MEETING").length;
  const doneTasksCount = tasks.filter((t) => t.status === "DONE").length;
  const totalSubTasksCount = tasks.reduce(
    (acc, t) => acc + (t.sub_tasks?.length || 0),
    0
  );

  // Handle Edit SubTask Open
  const handleOpenEditSubTask = (subTask: any) => {
    if (subTask.status === "DONE") {
      setErrorMessage("Sub-task yang sudah berstatus DONE/Selesai tidak dapat di-edit.");
      return;
    }
    setEditingSubTask(subTask);
    setSubTaskTitle(subTask.title);
    setSubTaskDesc(subTask.description || "");
    setSubTaskEmployeeId(subTask.assigned_employee_id || "");
    setSubTaskStatus(subTask.status || "TODO");
    setSubTaskOrder(subTask.order_index || 0);
    setIsEditModalOpen(true);
  };

  // Handle Save Edit Subtask
  const handleSaveEditSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !editingSubTask) return;
    try {
      setIsSaving(true);
      await api.updateSubTask(selectedTask.id, editingSubTask.id, {
        title: subTaskTitle,
        description: subTaskDesc,
        assigned_employee_id: subTaskEmployeeId,
        status: subTaskStatus,
        order_index: subTaskOrder,
      });
      setIsEditModalOpen(false);
      setEditingSubTask(null);
      await loadAllData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setErrorMessage("Gagal memperbarui sub-task: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Open Add Subtask
  const handleOpenAddSubTask = () => {
    if (!selectedTask) return;
    setSubTaskTitle("");
    setSubTaskDesc("");
    setSubTaskEmployeeId(employees[0]?.id || "");
    setSubTaskStatus("TODO");
    setSubTaskOrder((selectedTask.sub_tasks?.length || 0) + 1);
    setIsAddModalOpen(true);
  };

  // Handle Save Add Subtask
  const handleSaveAddSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      setIsSaving(true);
      await api.createSubTask(selectedTask.id, {
        title: subTaskTitle,
        description: subTaskDesc,
        assigned_employee_id: subTaskEmployeeId,
        status: subTaskStatus,
        order_index: subTaskOrder,
      });
      setIsAddModalOpen(false);
      await loadAllData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setErrorMessage("Gagal menambahkan sub-task: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete SubTask
  const handleDeleteSubTask = async (subTaskId: string, subTaskStatusVal: string) => {
    if (!selectedTask) return;
    if (subTaskStatusVal === "DONE") {
      setErrorMessage("Sub-task yang sudah berstatus DONE/Selesai tidak dapat dihapus.");
      return;
    }
    if (!window.confirm("Apakah Anda yakin ingin menghapus sub-task ini?")) return;

    try {
      setDeletingSubTaskId(subTaskId);
      await api.deleteSubTask(selectedTask.id, subTaskId);
      await loadAllData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setErrorMessage("Gagal menghapus sub-task: " + err.message);
    } finally {
      setDeletingSubTaskId(null);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">HIGH</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">LOW</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DONE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> DONE</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-900 flex items-center gap-1 w-fit animate-pulse"><Play className="w-3 h-3 fill-current" /> IN PROGRESS</span>;
      case "MEETING":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-900 flex items-center gap-1 w-fit"><MessagesSquare className="w-3 h-3" /> MEETING</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> BACKLOG</span>;
    }
  };

  const getSubtaskStatusBadge = (status: string) => {
    switch (status) {
      case "DONE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900">DONE</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-900 animate-pulse">IN PROGRESS</span>;
      case "FAILED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-900">FAILED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">TODO</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 rounded-2xl border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Tabel Task List & Kelola Sub-Task
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Pantau seluruh daftar tugas, diskusikan, dan kelola rincian sub-task tim AI (edit/hapus sub-task yang belum selesai).
          </p>
        </div>
        <button
          onClick={loadAllData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
          Refresh Data
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-medium">Total Task</span>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">{totalTasksCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-medium">Sedang Berjalan</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">{activeTasksCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-medium">Selesai (Done)</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{doneTasksCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-medium">Total Sub-Task</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">{totalSubTasksCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama task, kode, atau deskripsi..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua</option>
              <option value="BACKLOG">BACKLOG</option>
              <option value="MEETING">MEETING</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-lg text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Tipe:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Task & Diskusi</option>
              <option value="TASKS">Hanya Task (TASK-*)</option>
              <option value="DISCUSSIONS">Hanya Diskusi (DISC-*)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Task List Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
            <p className="text-xs font-medium">Memuat tabel task...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 space-y-2">
            <ListTodo className="w-10 h-10 mx-auto text-zinc-400" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tidak ada task yang cocok</p>
            <p className="text-xs">Coba ubah kata kunci pencarian atau filter status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Judul Task & Deskripsi</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">PM Lead</th>
                  <th className="px-4 py-3">Sub-Tasks</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredTasks.map((task) => {
                  const subTasksCount = task.sub_tasks?.length || 0;
                  const completedSubTasks = (task.sub_tasks || []).filter(
                    (st: any) => st.status === "DONE"
                  ).length;
                  const isSelected = selectedTask?.id === task.id;

                  return (
                    <React.Fragment key={task.id}>
                      <tr
                        className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors ${
                          isSelected ? "bg-amber-500/5 dark:bg-amber-500/10 border-l-4 border-amber-500" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {task.task_code}
                        </td>
                        <td className="px-4 py-3 max-w-md">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs leading-snug">
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                              {task.description}
                            </div>
                          )}
                          {task.project_root_path && (
                            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-1">
                              <FolderCode className="w-3 h-3 text-zinc-400" />
                              <span className="truncate">{task.project_root_path}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getPriorityBadge(task.priority)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(task.status)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {(() => {
                            let assignedIds: string[] = [];
                            if (task.assigned_employee_ids_json) {
                              try {
                                assignedIds = JSON.parse(task.assigned_employee_ids_json);
                              } catch (e) {
                                assignedIds = [];
                              }
                            }

                            if (assignedIds.length === 1) {
                              const emp = employees.find((e) => e.id === assignedIds[0]);
                              return emp ? (
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <img
                                      src={emp.avatar_url}
                                      alt={emp.name}
                                      className="w-5 h-5 rounded-full object-cover border border-amber-500"
                                    />
                                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                                      {emp.name}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 w-fit">
                                    👤 1-on-1 Direct
                                  </span>
                                </div>
                              ) : null;
                            }

                            if (assignedIds.length > 1) {
                              const assignedEmps = employees.filter((e) => assignedIds.includes(e.id));
                              return (
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex -space-x-1.5 overflow-hidden">
                                    {assignedEmps.map((emp) => (
                                      <img
                                        key={emp.id}
                                        src={emp.avatar_url}
                                        alt={emp.name}
                                        title={`${emp.name} (${emp.role})`}
                                        className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover"
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 w-fit">
                                    👥 Tim ({assignedEmps.length} AI)
                                  </span>
                                </div>
                              );
                            }

                            return task.assigned_pm ? (
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={task.assigned_pm.avatar_url}
                                  alt={task.assigned_pm.name}
                                  className="w-5 h-5 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                                />
                                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                  {task.assigned_pm.name} (Pleno)
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                              {completedSubTasks}/{subTasksCount}
                            </span>
                            {subTasksCount > 0 && (
                              <div className="w-16 bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-500 h-full transition-all"
                                  style={{
                                    width: `${Math.round(
                                      (completedSubTasks / subTasksCount) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                setSelectedTask(isSelected ? null : task)
                              }
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {isSelected ? "Tutup Detail" : "Detail & Sub-task"}
                            </button>
                            <button
                              onClick={() => onNavigate("meetings")}
                              title="Ke Ruang Diskusi"
                              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-100 dark:hover:bg-purple-950/50 text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                            >
                              <MessagesSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onNavigate("logs")}
                              title="Lihat Log Eksekusi"
                              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-950/50 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Sub-Task Expanded Row View */}
                      {isSelected && (
                        <tr>
                          <td colSpan={7} className="p-0 bg-amber-500/5 dark:bg-amber-500/10">
                            <div className="p-4 sm:p-5 border-y border-amber-500/20 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                                      [{task.task_code}]
                                    </span>
                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                      {task.title}
                                    </h3>
                                  </div>
                                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-wrap">
                                    {task.description || "Tidak ada deskripsi."}
                                  </p>
                                </div>
                                <button
                                  onClick={handleOpenAddSubTask}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  + Tambah Sub-task Baru
                                </button>
                              </div>

                              {/* Sub-task List Table */}
                              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                                    <ListTodo className="w-4 h-4 text-amber-500" />
                                    Daftar Sub-task ({task.sub_tasks?.length || 0})
                                  </span>
                                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    💡 Sub-task berstatus <strong className="text-amber-600 dark:text-amber-400 font-semibold">TODO / IN PROGRESS</strong> dapat di-edit & dihapus. Sub-task <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">DONE</strong> dilindungi.
                                  </span>
                                </div>

                                {!task.sub_tasks || task.sub_tasks.length === 0 ? (
                                  <div className="p-6 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                                    Belum ada sub-task yang dibuat untuk task ini.
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                          <th className="px-3 py-2 w-10">#</th>
                                          <th className="px-3 py-2">Judul & Detail Sub-task</th>
                                          <th className="px-3 py-2">Karyawan AI</th>
                                          <th className="px-3 py-2">Status</th>
                                          <th className="px-3 py-2 text-right">Aksi</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {task.sub_tasks.map((st: any, idx: number) => {
                                          const isDone = st.status === "DONE";
                                          return (
                                            <tr key={st.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30">
                                              <td className="px-3 py-2.5 font-mono text-zinc-400">
                                                {st.order_index ?? idx + 1}
                                              </td>
                                              <td className="px-3 py-2.5 max-w-sm">
                                                <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">
                                                  {st.title}
                                                </div>
                                                {st.description && (
                                                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                                                    {st.description}
                                                  </div>
                                                )}
                                              </td>
                                              <td className="px-3 py-2.5 whitespace-nowrap">
                                                {st.assigned_employee ? (
                                                  <div className="flex items-center gap-1.5">
                                                    <img
                                                      src={st.assigned_employee.avatar_url}
                                                      alt={st.assigned_employee.name}
                                                      className="w-4 h-4 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                                                    />
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                                                      {st.assigned_employee.name}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400">
                                                      ({st.assigned_employee.role})
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <span className="text-zinc-400">-</span>
                                                )}
                                              </td>
                                              <td className="px-3 py-2.5 whitespace-nowrap">
                                                {getSubtaskStatusBadge(st.status)}
                                              </td>
                                              <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                                {isDone ? (
                                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-900">
                                                    <Lock className="w-3 h-3" />
                                                    Terkunci (DONE)
                                                  </span>
                                                ) : (
                                                  <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                      onClick={() => handleOpenEditSubTask(st)}
                                                      className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                                    >
                                                      <Edit2 className="w-3 h-3" />
                                                      Edit
                                                    </button>
                                                    <button
                                                      onClick={() => handleDeleteSubTask(st.id, st.status)}
                                                      disabled={deletingSubTaskId === st.id}
                                                      className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-800 dark:text-red-300 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                      {deletingSubTaskId === st.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                      ) : (
                                                        <Trash2 className="w-3 h-3" />
                                                      )}
                                                      Hapus
                                                    </button>
                                                  </div>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Edit Sub-Task */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-500" />
                Edit Sub-Task
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEditSubTask} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Judul Sub-Task *
                </label>
                <input
                  type="text"
                  required
                  value={subTaskTitle}
                  onChange={(e) => setSubTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Deskripsi Sub-Task
                </label>
                <textarea
                  rows={3}
                  value={subTaskDesc}
                  onChange={(e) => setSubTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Assigned Karyawan AI
                  </label>
                  <select
                    value={subTaskEmployeeId}
                    onChange={(e) => setSubTaskEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Status Sub-task
                  </label>
                  <select
                    value={subTaskStatus}
                    onChange={(e) => setSubTaskStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Urutan (Order Index)
                </label>
                <input
                  type="number"
                  value={subTaskOrder}
                  onChange={(e) => setSubTaskOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Sub-Task */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                Tambah Sub-Task Baru untuk [{selectedTask?.task_code}]
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAddSubTask} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Judul Sub-Task *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Implementasi skema tabel users & refresh_tokens"
                  value={subTaskTitle}
                  onChange={(e) => setSubTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Deskripsi Sub-Task
                </label>
                <textarea
                  rows={3}
                  placeholder="Rincian instruksi teknis untuk karyawan AI..."
                  value={subTaskDesc}
                  onChange={(e) => setSubTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Assigned Karyawan AI *
                  </label>
                  <select
                    required
                    value={subTaskEmployeeId}
                    onChange={(e) => setSubTaskEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Status Awal
                  </label>
                  <select
                    value={subTaskStatus}
                    onChange={(e) => setSubTaskStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Urutan (Order Index)
                </label>
                <input
                  type="number"
                  value={subTaskOrder}
                  onChange={(e) => setSubTaskOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Buat Sub-task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        title="Pemberitahuan Sistem"
        message={errorMessage || ""}
      />
    </div>
  );
};