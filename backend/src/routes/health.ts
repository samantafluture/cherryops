import type { FastifyInstance } from "fastify";
import { getDatabase } from "../db/connection.js";
import { getTaskCountsByStatus } from "../db/tasks.js";
import { getAllDevices } from "../db/devices.js";

const startTime = Date.now();

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_request, reply) => {
    const db = getDatabase();
    const taskCounts = getTaskCountsByStatus(db);
    const deviceCount = getAllDevices(db).length;

    return reply.send({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
      tasks: taskCounts,
      devices: deviceCount,
    });
  });
}
