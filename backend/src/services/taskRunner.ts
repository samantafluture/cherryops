import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { Database } from "better-sqlite3";
import { updateTaskStatus } from "../db/tasks.js";
import type { RepoManager } from "./repoManager.js";
import type { FcmSender } from "./fcmSender.js";
import type { FrontmatterParser } from "./frontmatterParser.js";
import type { AppConfig } from "../types.js";

const execAsync = promisify(exec);

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [2_000, 5_000, 15_000];

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isTransient =
        lastError.message.includes("ECONNRESET") ||
        lastError.message.includes("ETIMEDOUT") ||
        lastError.message.includes("429") ||
        lastError.message.includes("502") ||
        lastError.message.includes("503");

      if (!isTransient || attempt >= maxRetries) {
        throw lastError;
      }

      const delay = RETRY_DELAYS_MS[attempt] ?? 15_000;
      console.warn(
        `[TaskRunner] ${label} attempt ${attempt + 1} failed, retrying in ${delay}ms: ${lastError.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError!;
}

interface TaskFileData {
  id: string;
  type: string;
  skill_id?: string;
  agent_mode: string;
  output_file: string;
  variables?: Record<string, string>;
  brief: string;
  context: string;
}

export class TaskRunner {
  constructor(
    private readonly config: AppConfig,
    private readonly repoManager: RepoManager,
    private readonly fcmSender: FcmSender,
    private readonly frontmatterParser: FrontmatterParser
  ) {}

  async executeTask(
    db: Database,
    taskId: string,
    repo: string,
    branch: string,
    taskFilePath: string
  ): Promise<void> {
    updateTaskStatus(db, taskId, "running", {
      started_at: new Date().toISOString(),
    });

    try {
      const fileData = await withRetry(
        () => this.readTaskFile(repo, branch, taskFilePath),
        `readTaskFile(${taskFilePath})`
      );

      let output: string;
      if (fileData.agent_mode === "cherry_agent") {
        output = await withRetry(
          () => this.runCherryAgent(fileData),
          `runCherryAgent(${taskId})`
        );
      } else {
        output = await withRetry(
          () => this.runApiDirect(fileData),
          `runApiDirect(${taskId})`
        );
      }

      const { commitSha } = await withRetry(
        () => this.repoManager.createOrUpdateFile(
          repo,
          fileData.output_file,
          output,
          `[cherryops] Task ${taskId} output`,
          branch
        ),
        `writeOutput(${taskId})`
      );

      // Update task frontmatter to complete
      const taskFile = await withRetry(
        () => this.repoManager.getFileContent(repo, taskFilePath, branch),
        `readTaskFile(${taskId})`
      );
      const updatedContent = this.frontmatterParser.updateField(
        taskFile.content,
        "status",
        "complete"
      );
      await withRetry(
        () => this.repoManager.createOrUpdateFile(
          repo,
          taskFilePath,
          updatedContent,
          `[cherryops] Task ${taskId} complete`,
          branch,
          taskFile.sha
        ),
        `updateTaskStatus(${taskId})`
      );

      updateTaskStatus(db, taskId, "complete", {
        completed_at: new Date().toISOString(),
        commit_sha: commitSha,
        output_file: fileData.output_file,
      });

      await this.fcmSender.sendTaskUpdate(taskId, "complete", repo, fileData.output_file);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";

      updateTaskStatus(db, taskId, "error", {
        completed_at: new Date().toISOString(),
        error: message,
      });

      await this.fcmSender.sendTaskUpdate(taskId, "error", repo);
    }
  }

  private async readTaskFile(
    repo: string,
    branch: string,
    path: string
  ): Promise<TaskFileData> {
    const file = await this.repoManager.getFileContent(repo, path, branch);
    const { frontmatter, body } = this.frontmatterParser.parse(file.content);

    const sections = body.split("---").map((s) => s.trim());
    const brief = sections[0]?.replace("# Task Brief\n", "").trim() ?? "";
    const context = sections.slice(1).join("\n\n").trim();

    return {
      id: frontmatter["id"] as string,
      type: (frontmatter["type"] as string) ?? "adhoc",
      skill_id: frontmatter["skill_id"] as string | undefined,
      agent_mode: (frontmatter["agent_mode"] as string) ?? "api_direct",
      output_file: (frontmatter["output_file"] as string) ?? `outputs/${frontmatter["id"] as string}.md`,
      variables: frontmatter["variables"] as Record<string, string> | undefined,
      brief,
      context,
    };
  }

  private async runApiDirect(taskData: TaskFileData): Promise<string> {
    const prompt = this.buildPrompt(taskData);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.config.anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };

    const textBlock = data.content.find((c) => c.type === "text");
    return textBlock?.text ?? "";
  }

  private async runCherryAgent(taskData: TaskFileData): Promise<string> {
    const prompt = this.buildPrompt(taskData);
    const escapedPrompt = prompt.replace(/'/g, "'\\''");

    const { stdout } = await execAsync(
      `claude -p '${escapedPrompt}' --output-format text`,
      {
        timeout: 300000,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: this.config.anthropicApiKey,
        },
      }
    );

    return stdout;
  }

  private buildPrompt(taskData: TaskFileData): string {
    let prompt = taskData.brief;

    // Interpolate variables into the prompt
    if (taskData.variables) {
      for (const [key, value] of Object.entries(taskData.variables)) {
        prompt = prompt.replaceAll(`{{${key}}}`, value);
      }
    }

    // Built-in template variables
    prompt = prompt.replaceAll("{{date}}", new Date().toISOString().slice(0, 10));
    prompt = prompt.replaceAll("{{project_name}}", taskData.id);

    if (taskData.context) {
      prompt += `\n\n---\n\nContext:\n${taskData.context}`;
    }

    return prompt;
  }

  async mergeContextFiles(
    repo: string,
    branch: string,
    contextPaths: string[],
    variables?: Record<string, string>
  ): Promise<string> {
    const contextParts: string[] = [];

    for (const rawPath of contextPaths) {
      let resolvedPath = rawPath;
      // Interpolate variables in context file paths
      if (variables) {
        for (const [key, value] of Object.entries(variables)) {
          resolvedPath = resolvedPath.replaceAll(`{{${key}}}`, value);
        }
      }

      try {
        const file = await this.repoManager.getFileContent(repo, resolvedPath, branch);
        contextParts.push(`## ${resolvedPath}\n\n${file.content}`);
      } catch {
        contextParts.push(`## ${resolvedPath}\n\n[File not found]`);
      }
    }

    return contextParts.join("\n\n---\n\n");
  }
}
