import type { FastifyInstance } from "fastify";
import type { RepoManager } from "../services/repoManager.js";

export function createFileRoutes(repoManager: RepoManager) {
  return async function fileRoutes(app: FastifyInstance): Promise<void> {
    app.get<{ Querystring: { repo: string; branch?: string } }>(
      "/files/tree",
      { onRequest: [app.authenticate] },
      async (request, reply) => {
        const { repo, branch } = request.query;
        if (!repo) {
          return reply.status(400).send({ error: "repo is required" });
        }

        try {
          const tree = await repoManager.getFileTree(repo, branch || "main");
          return reply.send({ tree });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch file tree";
          return reply.status(502).send({ error: message });
        }
      }
    );

    app.get<{ Querystring: { repo: string; path: string; branch?: string } }>(
      "/files/content",
      { onRequest: [app.authenticate] },
      async (request, reply) => {
        const { repo, path, branch } = request.query;
        if (!repo || !path) {
          return reply
            .status(400)
            .send({ error: "repo and path are required" });
        }

        try {
          const file = await repoManager.getFileContent(
            repo,
            path,
            branch || "main"
          );
          return reply.send(file);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch file";
          return reply.status(502).send({ error: message });
        }
      }
    );

    app.put<{
      Body: { repo: string; path: string; content: string; sha: string; branch?: string; message?: string };
    }>(
      "/files/content",
      { onRequest: [app.authenticate] },
      async (request, reply) => {
        const { repo, path, content, sha, branch, message } = request.body;
        if (!repo || !path || !content || !sha) {
          return reply
            .status(400)
            .send({ error: "repo, path, content, and sha are required" });
        }

        try {
          const result = await repoManager.createOrUpdateFile(
            repo,
            path,
            content,
            message || `Update ${path}`,
            branch || "main",
            sha
          );
          return reply.send(result);
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Failed to update file";
          return reply.status(502).send({ error: msg });
        }
      }
    );
  };
}
