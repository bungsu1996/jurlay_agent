const BASE_URL = "/api";

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Terjadi kesalahan pada server");
  }
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Tasks
  getTasks: () => fetchApi<any[]>("/tasks"),
  getTaskById: (id: string) => fetchApi<any>(`/tasks/${id}`),
  createTask: (data: { title: string; description: string; priority?: string; github_project_id?: string }) =>
    fetchApi<any>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTaskStatus: (id: string, status: string) =>
    fetchApi<any>(`/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  startMeeting: (id: string) => fetchApi<any>(`/tasks/${id}/start-meeting`, { method: "POST" }),
  approvePlan: (id: string) => fetchApi<any>(`/tasks/${id}/approve-plan`, { method: "POST" }),
  executeSubTask: (taskId: string, subTaskId: string) =>
    fetchApi<any>(`/tasks/${taskId}/subtasks/${subTaskId}/execute`, { method: "POST" }),
  getTaskLogs: (id: string) => fetchApi<any[]>(`/tasks/${id}/logs`),

  // Employees
  getEmployees: () => fetchApi<any[]>("/employees"),
  createEmployee: (data: any) => fetchApi<any>("/employees", { method: "POST", body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: any) => fetchApi<any>(`/employees/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getEmployeeMessages: (employeeId: string) => fetchApi<any[]>(`/employees/${employeeId}/messages`),
  sendEmployeeMessage: (employeeId: string, content: string) =>
    fetchApi<any>(`/employees/${employeeId}/messages`, { method: "POST", body: JSON.stringify({ content }) }),

  // Meetings
  getMeetingByTaskId: (taskId: string) => fetchApi<any>(`/meetings/task/${taskId}`),
  sendCEOMessage: (meetingId: string, content: string) =>
    fetchApi<any>(`/meetings/${meetingId}/message`, { method: "POST", body: JSON.stringify({ content }) }),
  triggerMeetingRound: (meetingId: string) =>
    fetchApi<any>(`/meetings/${meetingId}/trigger-round`, { method: "POST" }),

  // Projects
  getProjects: () => fetchApi<any[]>("/projects"),
  createProject: (data: { name: string; repo_url?: string; local_path: string; default_branch?: string }) =>
    fetchApi<any>("/projects", { method: "POST", body: JSON.stringify(data) }),
  getProjectStatus: (id: string) => fetchApi<any>(`/projects/${id}/status`),
  pullProject: (id: string) => fetchApi<any>(`/projects/${id}/pull`, { method: "POST" }),

  // Terminals
  getTerminals: () => fetchApi<any[]>("/terminals"),
};
