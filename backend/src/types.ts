export type TaskStatus =
  | "pending"
  | "queued"
  | "running"
  | "complete"
  | "error"
  | "discarded"
  | "done";

export type TaskType = "skill" | "adhoc";

export type AgentMode = "api_direct" | "cherry_agent";

export type OutputFormat = "markdown" | "plain" | "diff";

export type SkillCategory =
  | "client"
  | "content"
  | "dev"
  | "ops"
  | "finance"
  | "custom";

export type SkillPersona = "builder" | "operator" | "both";

export type VariableType = "string" | "select" | "file_picker";

export interface TaskRecord {
  id: string;
  repo: string;
  branch: string;
  task_file_path: string;
  status: TaskStatus;
  type: TaskType;
  skill_id: string | null;
  agent_mode: AgentMode;
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

export interface SkillVariable {
  id: string;
  label: string;
  type: VariableType;
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
  agent_mode: AgentMode;
  context_files: string[];
  variables: SkillVariable[];
  prompt_template: string;
  output_file: string;
  output_format: OutputFormat;
  tags: string[];
  min_app_version?: string;
}

export interface TaskDispatchRequest {
  task_id: string;
  repo: string;
  branch: string;
  task_file_path: string;
}

export interface TaskDispatchResponse {
  task_id: string;
  status: "queued";
  estimated_start_seconds: number;
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
  output_format: OutputFormat | null;
  diff: string | null;
  commit_sha: string | null;
}

export interface TaskApproveRequest {
  action: "approve";
}

export interface TaskRedirectRequest {
  new_brief: string;
  inherit_context: boolean;
}

export interface TaskRedirectResponse {
  original_task_id: string;
  new_task_id: string;
  status: "queued";
}

export interface SkillValidateRequest {
  skill_yaml: string;
}

export interface SkillValidateResponse {
  valid: boolean;
  skill_id?: string;
  errors?: string[];
  warnings?: string[];
}

export interface VoiceTranscribeRequest {
  audio_base64: string;
  mime_type: string;
  language_hint?: string;
}

export interface VoiceTranscribeResponse {
  transcript: string;
  confidence: number;
  duration_seconds: number;
}

export interface DeviceRegisterRequest {
  fcm_token: string;
  device_id: string;
  platform: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  githubPat: string;
  firebaseServiceAccount: string;
  geminiApiKey: string;
  anthropicApiKey: string;
}
