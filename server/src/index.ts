import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createGeminiQuestionGenerator } from './services/gemini.js';

function main(): void {
  const config = loadConfig();
  const generator = createGeminiQuestionGenerator(config);
  const app = createApp({ config, generator });

  app.listen(config.port, () => {
    console.info(`[interview-iq] server listening on :${config.port} (${config.nodeEnv})`);
  });
}

main();
