import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { registerRateLimit } from "./middleware/rateLimit.js";
import { authMiddleware } from "./middleware/auth.js";
import { healthRoutes } from "./routes/health.js";
import { createTaskRoutes } from "./routes/tasks.js";
import { skillRoutes } from "./routes/skills.js";
import { createVoiceRoutes } from "./routes/voice.js";
import { deviceRoutes } from "./routes/device.js";
import { getDatabase, closeDatabase } from "./db/connection.js";
import { RepoManager } from "./services/repoManager.js";
import { TaskRunner } from "./services/taskRunner.js";
import { TaskQueue } from "./services/taskQueue.js";
import { FcmSender } from "./services/fcmSender.js";
import { GeminiProxy } from "./services/geminiProxy.js";
import { FrontmatterParser } from "./services/frontmatterParser.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: typeof authMiddleware;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

async function start(): Promise<void> {
  const config = loadConfig();

  const app = Fastify({
    logger: {
      level: config.nodeEnv === "production" ? "info" : "debug",
    },
  });

  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: config.jwtSecret });
  app.decorate("authenticate", authMiddleware);
  await registerRateLimit(app);

  // Ensure data directory exists
  const dataDir = path.resolve("data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialize database
  const db = getDatabase();

  // Initialize services
  const repoManager = new RepoManager(config);
  const frontmatterParser = new FrontmatterParser();
  const fcmSender = new FcmSender(config.firebaseServiceAccount);
  fcmSender.setDb(db);
  const geminiProxy = new GeminiProxy(config.geminiApiKey);
  const taskRunner = new TaskRunner(config, repoManager, fcmSender, frontmatterParser);
  const taskQueue = new TaskQueue(taskRunner);

  // Register routes under /api/v1 prefix
  await app.register(
    async (api) => {
      await api.register(healthRoutes);
      await api.register(createTaskRoutes(taskQueue, repoManager));
      await api.register(skillRoutes);
      await api.register(createVoiceRoutes(geminiProxy));
      await api.register(deviceRoutes);
    },
    { prefix: "/api/v1" }
  );

  // Graceful shutdown
  const shutdown = async (): Promise<void> => {
    app.log.info("Shutting down...");
    closeDatabase();
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  await app.listen({ port: config.port, host: "0.0.0.0" });
  app.log.info(`CherryOps backend listening on port ${config.port}`);
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
