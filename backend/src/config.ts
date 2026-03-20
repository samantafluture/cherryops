import type { AppConfig } from "./types.js";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(optionalEnv("PORT", "3100"), 10),
    nodeEnv: optionalEnv("NODE_ENV", "development"),
    jwtSecret: requireEnv("CHERRYOPS_JWT_SECRET"),
    githubPat: optionalEnv("GITHUB_PAT", ""),
    firebaseServiceAccount: optionalEnv("FIREBASE_SERVICE_ACCOUNT_JSON", "{}"),
    geminiApiKey: optionalEnv("GEMINI_API_KEY", ""),
    anthropicApiKey: optionalEnv("ANTHROPIC_API_KEY", ""),
  };
}
