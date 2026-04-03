// API types — mirrors backend/src/types.ts
export type TaskStatus = "pending" | "queued" | "running" | "complete" | "error" | "discarded" | "done";

export interface TaskRecord {
  id: string;
  repo: string;
  branch: string;
  task_file_path: string;
  status: TaskStatus;
  type: string;
  skill_id: string | null;
  agent_mode: string;
  output_file: string | null;
  error: string | null;
  commit_sha: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface DeviceRecord {
  id: string;
  fcm_token: string;
  device_id: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime_seconds: number;
  tasks: Record<string, number>;
  devices: number;
}

export interface TaskListResponse {
  tasks: TaskRecord[];
  total: number;
}

export interface TaskStatusResponse {
  task_id: string;
  status: TaskStatus;
  started_at: string | null;
  completed_at: string | null;
  output_file: string | null;
  error: string | null;
}

export interface TaskResultResponse {
  task_id: string;
  output_file: string | null;
  content: string | null;
  output_format: string | null;
  diff: string | null;
  commit_sha: string | null;
}

export interface SkillValidateResponse {
  valid: boolean;
  skill_id?: string;
  errors?: string[];
  warnings?: string[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface TaskCreateResponse {
  task_id: string;
  status: "queued";
  estimated_start_seconds: number;
}

export type SkillCategory = "client" | "content" | "dev" | "ops" | "finance" | "custom";
export type SkillPersona = "builder" | "operator" | "both";

export interface SkillVariable {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface SkillDefinition {
  schema_version: string;
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: string;
  category: SkillCategory;
  persona: SkillPersona;
  agent_mode: string;
  context_files: string[];
  variables: SkillVariable[];
  prompt_template: string;
  output_file: string;
  output_format: string;
  tags: string[];
}

export interface SkillListResponse {
  skills: SkillDefinition[];
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

export interface FileContentResponse {
  path: string;
  content: string;
  sha: string;
  encoding: string;
}

// API client
class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("cherryops_token");

  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("cherryops_token");
    window.location.href = "/login";
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body);
  }

  return res.json();
}

export const api = {
  // Health
  health: () => request<HealthResponse>("/api/v1/health"),

  // Auth
  loginWithToken: (adminToken: string) =>
    request<AuthResponse>("/api/v1/auth/token", {
      method: "POST",
      body: JSON.stringify({ admin_token: adminToken }),
    }),

  refreshToken: (refreshToken: string) =>
    request<AuthResponse>("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  // Tasks
  listTasks: (params?: { status?: string; repo?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.repo) query.set("repo", params.repo);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    const qs = query.toString();
    return request<TaskListResponse>(`/api/v1/tasks${qs ? `?${qs}` : ""}`);
  },

  taskStatus: (taskId: string) =>
    request<TaskStatusResponse>(`/api/v1/tasks/${taskId}/status`),

  taskResult: (taskId: string) =>
    request<TaskResultResponse>(`/api/v1/tasks/${taskId}/result`),

  approveTask: (taskId: string) =>
    request<{ task_id: string; status: string }>(`/api/v1/tasks/${taskId}/approve`, {
      method: "POST",
      body: JSON.stringify({ action: "approve" }),
    }),

  redirectTask: (taskId: string, newBrief: string) =>
    request<{ original_task_id: string; new_task_id: string }>(`/api/v1/tasks/${taskId}/redirect`, {
      method: "POST",
      body: JSON.stringify({ new_brief: newBrief, inherit_context: true }),
    }),

  discardTask: (taskId: string) =>
    request<{ task_id: string; status: string }>(`/api/v1/tasks/${taskId}/discard`, {
      method: "POST",
    }),

  createTask: (params: { repo: string; branch?: string; brief: string; skill_id?: string; agent_mode?: "api_direct" | "cherry_agent" }) =>
    request<TaskCreateResponse>("/api/v1/tasks/create", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  // Files
  fileTree: (repo: string, branch = "main") => {
    const query = new URLSearchParams({ repo, branch });
    return request<{ tree: GitHubTreeItem[] }>(`/api/v1/files/tree?${query}`);
  },

  fileContent: (repo: string, path: string, branch = "main") => {
    const query = new URLSearchParams({ repo, path, branch });
    return request<FileContentResponse>(`/api/v1/files/content?${query}`);
  },

  updateFileContent: (params: { repo: string; path: string; content: string; sha: string; branch?: string; message?: string }) =>
    request<{ sha: string; commitSha: string }>("/api/v1/files/content", {
      method: "PUT",
      body: JSON.stringify(params),
    }),

  // Skills
  listSkills: () =>
    request<SkillListResponse>("/api/v1/skills"),

  validateSkill: (yaml: string) =>
    request<SkillValidateResponse>("/api/v1/skills/validate", {
      method: "POST",
      body: JSON.stringify({ skill_yaml: yaml }),
    }),

  // Devices
  listDevices: () =>
    request<{ devices: DeviceRecord[] }>("/api/v1/devices"),
};
