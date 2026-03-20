import type { FastifyInstance } from "fastify";
import { getDatabase } from "../db/connection.js";
import { upsertDevice } from "../db/devices.js";
import type { DeviceRegisterRequest } from "../types.js";

export async function deviceRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: DeviceRegisterRequest }>(
    "/device/register",
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const { fcm_token, device_id, platform } = request.body;

      if (!fcm_token || !device_id) {
        return reply
          .status(422)
          .send({ error: "fcm_token and device_id are required" });
      }

      const db = getDatabase();
      upsertDevice(db, device_id, fcm_token, platform ?? "android");

      return reply.send({ registered: true });
    }
  );
}
