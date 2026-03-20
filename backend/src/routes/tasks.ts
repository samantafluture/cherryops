import type { FastifyInstance } from "fastify";
import { ulid } from "ulid";
import { getDatabase } from "../db/connection.js";
import {
  insertTask,
  getTaskById,
  updateTaskStatus,
  getRunningTaskCountByRepo,
} from "../db/tasks.js";
import type { TaskQueue } from "../services/taskQueue.js";
import type { RepoManager } from "../services/repoManager.js";
import type {
  TaskDispatchRequest,
  TaskDispatchResponse,
  TaskStatusResponse,
  TaskResultResponse,
  TaskApproveRequest,
  TaskRedirectRequest,
  TaskRedirectResponse,
} from "../types.js";

const MAX_CONCURRENT_PER_REPO = 2;

export function createTaskRoutes(taskQueue: TaskQueue, repoManager: RepoManager) {
  return async function taskRoutes(app: FastifyInstance): Promise<void> {
    app.post<{ Body: TaskDispatchRequest }>(
      "/tasks/dispatch",
      { onRequest: [app.authenticate] },
      async (request, reply) => {
        const { task_id, repo, branch, task_file_path } = request.body;
        const db = getDatabase();

        const existing = getTaskById(db, task_id);
        if (existing) {
          return reply.status(409).send({ error: "Task ID already exists" });
        }

        const runningCount = getRunningTaskCountByRepo(db, repo);

        insertTask(db, {
          id: task_id,
          repo,
          branch,
          task_file_path,
          status: "queued",
          type: "adhoc",
          skill_id: null,
          agent_mode: "api_direct",
          output_file: null,
          created_at: new Date().toISOString(),
        });

        // Enqueue for async execution
        void taskQueue.enqueue(db, task_id, repo, branch, task_file_path);

        const response: TaskDispatchResponse = {
          task_id,
          status: "queued",
          estimated_start_seconds: runningCount >= MAX_CONCURRENT_PER_REPO ? 30 : 5,
        };

        return reply.status(202).send(response);
      }
    );

    app.get<{ Params: { task_id: string } }>(
      "/tasks/:task_id/status",
      { onRequest: [app.authenticate] },
      async (request, reply) => {
        const db = getDatabase();
        const task = getTaskById(db, request.params.task_id);

        if (!task) {
          return reply.status(404).send({ error: "Task not found" });
        }

        const response: TaskStatusResponse = {
          task_id: task.id,
          status: task.status,
          started_at: task.started_at,
          completed_at: task.completed_at,
          output_file: task.output_file,
          error: task.error,
        };

        return reply.send(response);
      }
    );

    app.get<{ Params: { task_id: string } }>(
      "/tasks/:task_id/result",
      { onRequest: [app.authenticate] },
      async (request, reply) => {
        const db = getDatabase();
        const task = getTaskById(db, request.params.task_id);

        if (!task) {
          return reply.status(404).send({ error: "Task not found" });
        }

        if (task.status !== "complete" && task.status !== "done") {
          return reply
            .status(400)
            .send({ error: "Task has not completed yet" });
        }

        // Fetch output content from repo
        let content: string | null = null;
        if (task.output_file) {
          try {
            const file = await repoManager.getFileContent(
              task.repo,
              task.output_file,
              task.branch
            );
            content = file.content;
          } catch {
            content = null;
          }
        }

        const response: TaskResultResponse = {
          task_id: task.id,
          output_file: task.output_file,
          content,
          output_format: null,
          diff: null,
          commit_sha: task.commit_sha,
        };

        return reply.send(response);
      }
    );

    app.post<{ Params: { task_id: string }; Body: TaskApproveRequest }>(
      "/tasks/:task_id/approve",
      { onRequest: [app.authenticate] },
      async (request, reply) => {
        const db = getDatabase();
        const task = getTaskById(db, request.params.task_id);

        if (!task) {
          return reply.status(404).send({ error: "Task not found" });
        }

        if (task.status !== "complete") {
          return reply
            .status(400)
            .send({ error: "Only completed tasks can be approved" });
        }

        updateTaskStatus(db, task.id, "done");

        return reply.send({
          task_id: task.id,
          status: "done",
          commit_sha: task.commit_sha,
        });
      }
    );

    app.post<{ Params: { task_id: string }; Body: TaskRedirectRequest }>(
      "/tasks/:task_id/redirect",
      { onRequest: [app.authenticate] },
      async (request, reply) => {
        const db = getDatabase();
        const task = getTaskById(db, request.params.task_id);

        if (!task) {
          return reply.status(404).send({ error: "Task not found" });
        }

        const newTaskId = ulid();

        insertTask(db, {
          id: newTaskId,
          repo: task.repo,
          branch: task.branch,
          task_file_path: `pending/${newTaskId}.md`,
          status: "queued",
          type: task.type,
          skill_id: task.skill_id,
          agent_mode: task.agent_mode,
          output_file: task.output_file,
          created_at: new Date().toISOString(),
        });

        updateTaskStatus(db, task.id, "discarded");

        const response: TaskRedirectResponse = {
          original_task_id: task.id,
          new_task_id: newTaskId,
          status: "queued",
        };

        return reply.status(202).send(response);
      }
    );

    app.post<{ Params: { task_id: string } }>(
      "/tasks/:task_id/discard",
      { onRequest: [app.authenticate] },
      async (request, reply) => {
        const db = getDatabase();
        const task = getTaskById(db, request.params.task_id);

        if (!task) {
          return reply.status(404).send({ error: "Task not found" });
        }

        updateTaskStatus(db, task.id, "discarded");

        return reply.send({
          task_id: task.id,
          status: "discarded",
        });
      }
    );
  };
}
