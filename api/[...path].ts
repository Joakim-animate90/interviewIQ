// Vercel serverless adapter.
//
// We do *lazy* boot (dynamic imports) inside a try/catch so any module-load or
// config error surfaces to the client as a structured JSON response instead of
// the opaque `FUNCTION_INVOCATION_FAILED` page. The boot promise is cached on
// success so subsequent warm invocations skip re-initialisation.

import type { IncomingMessage, ServerResponse } from 'node:http';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

let bootPromise: Promise<Handler> | null = null;

async function boot(): Promise<Handler> {
  // Imported from compiled output produced by `npm run build` (vercel.json buildCommand).
  // @ts-expect-error -- resolved at runtime after the server is compiled.
  const { createApp } = await import('../server/dist/app.js');
  // @ts-expect-error -- resolved at runtime after the server is compiled.
  const { loadConfig } = await import('../server/dist/config.js');
  // @ts-expect-error -- resolved at runtime after the server is compiled.
  const { createGeminiQuestionGenerator } = await import('../server/dist/services/gemini.js');

  const config = loadConfig();
  const generator = createGeminiQuestionGenerator(config);
  return createApp({ config, generator });
}

function getApp(): Promise<Handler> {
  if (!bootPromise) {
    bootPromise = boot().catch((err) => {
      // Reset so the next request retries (e.g. after env var is added).
      bootPromise = null;
      throw err;
    });
  }
  return bootPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const app = await getApp();
    app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        error: {
          code: 'BOOT_ERROR',
          message,
          stack: process.env.VERCEL_ENV === 'production' ? undefined : stack,
        },
      }),
    );
  }
}
