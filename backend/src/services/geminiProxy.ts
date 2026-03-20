import type { VoiceTranscribeResponse } from "../types.js";

export class GeminiProxy {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribe(
    audioBase64: string,
    mimeType: string,
    languageHint?: string
  ): Promise<VoiceTranscribeResponse> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: audioBase64,
                  },
                },
                {
                  text: `Transcribe this audio recording accurately.${languageHint ? ` The language is ${languageHint}.` : ""} Return only the transcription text, nothing else.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as {
      candidates: Array<{
        content: { parts: Array<{ text: string }> };
      }>;
    };

    const transcript =
      data.candidates[0]?.content.parts[0]?.text ?? "";

    return {
      transcript: transcript.trim(),
      confidence: 0.95,
      duration_seconds: 0,
    };
  }
}
