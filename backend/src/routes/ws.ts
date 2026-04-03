import type { FastifyInstance } from "fastify";
import type { EventBus } from "../services/eventBus.js";

export function createWsRoutes(eventBus: EventBus) {
  return async function wsRoutes(app: FastifyInstance): Promise<void> {
    app.get(
      "/ws",
      { websocket: true },
      async (socket, request) => {
        // Authenticate via query param token
        const url = new URL(request.url, `http://${request.headers.host}`);
        const token = url.searchParams.get("token");

        if (!token) {
          socket.send(JSON.stringify({ type: "error", message: "Missing token" }));
          socket.close();
          return;
        }

        try {
          app.jwt.verify(token);
        } catch {
          socket.send(JSON.stringify({ type: "error", message: "Invalid token" }));
          socket.close();
          return;
        }

        // Subscribe to task events
        const unsubscribe = eventBus.onTaskUpdate((event) => {
          if (socket.readyState === 1) {
            socket.send(JSON.stringify({ type: "task_update", ...event }));
          }
        });

        socket.on("close", () => {
          unsubscribe();
        });

        socket.send(JSON.stringify({ type: "connected" }));
      }
    );
  };
}
