import { existsSync } from 'node:fs';
import path from 'node:path';

import { config as dotenvConfig } from 'dotenv';

// Load .env from the first plausible location (cwd, server/, repo root).
// Process env always wins, so this is safe to run on top of explicit envs.
loadEnv();

export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  geminiApiKey: string;
  geminiModel: string;
  corsOrigins: string[];
  upstreamTimeoutMs: number;
  clientDistPath: string | null;
}

function required(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig(): ServerConfig {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as ServerConfig['nodeEnv'];

  return {
    port: Number(process.env.PORT ?? 8787),
    nodeEnv,
    geminiApiKey:
      nodeEnv === 'test'
        ? (process.env.GEMINI_API_KEY ?? 'test-key')
        : required('GEMINI_API_KEY', process.env.GEMINI_API_KEY),
    geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
    corsOrigins: (process.env.CORS_ORIGIN ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    upstreamTimeoutMs: Number(process.env.UPSTREAM_TIMEOUT_MS ?? 15_000),
    clientDistPath: process.env.CLIENT_DIST_PATH ?? null,
  };
}

function loadEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];
  for (const file of candidates) {
    if (existsSync(file)) {
      dotenvConfig({ path: file, override: false });
    }
  }
}
