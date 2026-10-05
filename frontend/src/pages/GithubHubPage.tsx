import React, { useState, useEffect } from "react";
import {
  GitBranch,
  FolderGit2,
  Plus,
  RefreshCw,
  GitCommit,
  ExternalLink,
} from "lucide-react";
import { api } from "../services/api";
import { Modal } from "../components/Modal";
import { PageDocBanner } from "../components/PageDocBanner";
import { pageDocs } from "../data/pageDocs";

interface GithubHubPageProps {
  projects: any[];
  onRefreshProjects: () => void;
}

export const GithubHubPage: React.FC<GithubHubPageProps> = ({
  projects,
  onRefreshProjects,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<any | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [pulling, setPulling] = useState(false);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectStatus(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadProjectStatus = async (id: string) => {
    try {
      setLoadingStatus(true);
      const data = await api.getProjectStatus(id);
      setProjectStatus(data);
    } catch (err) {
      console.error("Load git status error:", err);
      setProjectStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !localPath) return;

    try {
      setLoadingAdd(true);
      await api.createProject({
        name,
        repo_url: repoUrl || undefined,
        local_path: localPath,
      });
      setIsAddOpen(false);
      setName("");
      setRepoUrl("");
      setLocalPath("");
      onRefreshProjects();
    } catch (err: any) {
      alert("Gagal menambahkan project: " + err.message);
    } finally {
      setLoadingAdd(false);
    }
  };

  const handlePullGit = async () => {
    if (!selectedProjectId) return;
    try {
      setPulling(true);
      await api.pullProject(selectedProjectId);
      await loadProjectStatus(selectedProjectId);
      alert("Berhasil melakukan git pull!");
    } catch (err: any) {
      alert("Gagal pull: " + err.message);
    } finally {
      setPulling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Panduan Halaman Lengkap */}
      <PageDocBanner doc={pageDocs.github} />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-600 text-white shadow-sm">
              <FolderGit2 className="w-5 h-5" />
            </span>
            <span>GitHub Project Hub</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Daftar repository target yang dikerjakan oleh karyawan AI JURLAY AGENT.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-600/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Hubungkan Repo Baru</span>
        </button>
      </div>

      {/* Main Grid: Projects List + Selected Project Git Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Left Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Workspace Terhubung ({projects.length})
          </h3>

          <div className="space-y-2">
            {projects.map((proj) => {
              const isSelected = selectedProjectId === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/80 dark:bg-slate-800/90 border-indigo-400 dark:border-indigo-500/50 shadow-sm"
                      : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{proj.name}</h4>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-[10px] border border-slate-200 dark:border-slate-800">
                      {proj.default_branch}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-1">
                    {proj.local_path}
                  </p>

                  {proj.repo_url && (
                    <a
                      href={proj.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline mt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Lihat GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Project Git Details Right Column */}
        <div className="lg:col-span-2 space-y-4">
          {projectStatus ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
              {/* Project Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{projectStatus.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <GitBranch className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {projectStatus.currentBranch || "main"}
                    </span>
                    <span>·</span>
                    <span className="font-mono truncate">{projectStatus.local_path}</span>
                  </div>
                </div>

                <button
                  disabled={pulling}
                  onClick={handlePullGit}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-all shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${pulling ? "animate-spin" : ""}`} />
                  <span>{pulling ? "Pulling..." : "Git Pull"}</span>
                </button>
              </div>

              {/* Status metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Git Status</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {projectStatus.isRepo ? "Valid Git Repo" : "Bukan Git Repo"}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Modified Files</div>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {projectStatus.status?.modified?.length || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Untracked</div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                    {projectStatus.status?.not_added?.length || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Sync Status</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    Synced
                  </div>
                </div>
              </div>

              {/* Recent Commits */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <GitCommit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Riwayat Commit Terakhir</span>
                </h4>

                <div className="space-y-2">
                  {(!projectStatus.commits || projectStatus.commits.length === 0) ? (
                    <div className="p-4 text-xs text-slate-500 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800">
                      Tidak ada riwayat commit atau bukan git repository.
                    </div>
                  ) : (
                    projectStatus.commits.map((c: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            {c.hash}
                          </span>
                          <span className="text-slate-700 dark:text-slate-200 truncate">{c.message}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 shrink-0">
                          {c.author_name}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-400 shadow-sm">
              Pilih project di sebelah kiri untuk melihat detail status Git.
            </div>
          )}
        </div>
      </div>

      {/* Add Project Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Hubungkan Project Baru"
      >
        <form onSubmit={handleAddProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Project / Workspace
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Next.js Web App"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Local Path Direktori (Wajib ada di file system)
            </label>
            <input
              type="text"
              required
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              placeholder="e.g. /Applications/hamzah_belajar/my-app"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              GitHub URL (Opsional)
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loadingAdd}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
            >
              {loadingAdd ? "Menyimpan..." : "Hubungkan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
