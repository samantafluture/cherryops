import type { FastifyInstance } from "fastify";
import type { VoiceTranscribeRequest } from "../types.js";
import { GeminiProxy } from "../services/geminiProxy.js";

const MAX_AUDIO_DURATION_SECONDS = 60;
const SUPPORTED_MIME_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"];

export function createVoiceRoutes(geminiProxy: GeminiProxy) {
  return async function voiceRoutes(app: FastifyInstance): Promise<void> {
    app.post<{ Body: VoiceTranscribeRequest }>(
      "/voice/transcribe",
      { onRequest: [app.authenticate] },
      async (request, reply) => {
        const { audio_base64, mime_type, language_hint } = request.body;

        if (!audio_base64 || !mime_type) {
          return reply
            .status(422)
            .send({ error: "audio_base64 and mime_type are required" });
        }

        if (!SUPPORTED_MIME_TYPES.includes(mime_type)) {
          return reply
            .status(422)
            .send({ error: `Unsupported audio format. Supported: ${SUPPORTED_MIME_TYPES.join(", ")}` });
        }

        const audioBytes = Buffer.from(audio_base64, "base64");
        const estimatedDuration = audioBytes.length / (16000 * 2);

        if (estimatedDuration > MAX_AUDIO_DURATION_SECONDS) {
          return reply
            .status(413)
            .send({ error: `Audio exceeds ${MAX_AUDIO_DURATION_SECONDS} second limit` });
        }

        const response = await geminiProxy.transcribe(
          audio_base64,
          mime_type,
          language_hint
        );

        return reply.send(response);
      }
    );
  };
}
