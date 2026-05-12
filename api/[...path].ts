// Vercel serverless adapter — exposes the Express app as a single function
// that handles every request under `/api/*` (catch-all filename routing).
//
// We import the *compiled* server output so Vercel's function bundler doesn't
// need to traverse TS source outside the function root. Both packages are
// built in vercel.json's buildCommand (`npm run build`).

// @ts-expect-error -- resolved at build time after the server is compiled.
import { createApp } from '../server/dist/app.js';
// @ts-expect-error -- resolved at build time after the server is compiled.
import { loadConfig } from '../server/dist/config.js';
// @ts-expect-error -- resolved at build time after the server is compiled.
import { createGeminiQuestionGenerator } from '../server/dist/services/gemini.js';

const config = loadConfig();
const generator = createGeminiQuestionGenerator(config);
const app = createApp({ config, generator });

export default app;
