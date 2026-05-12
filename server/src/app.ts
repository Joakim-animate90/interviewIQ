import path from 'node:path';

import compression from 'compression';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import type { ServerConfig } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { questionsRouter } from './routes/questions.js';
import type { QuestionGenerator } from './services/gemini.js';

export interface AppDeps {
  config: ServerConfig;
  generator: QuestionGenerator;
}

export function createApp({ config, generator }: AppDeps): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '8kb' }));

  if (config.corsOrigins.length > 0) {
    app.use(cors({ origin: config.corsOrigins, methods: ['GET', 'POST'] }));
  }

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const apiLimiter = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: {
        code: 'UPSTREAM_RATE_LIMITED',
        message: 'Too many requests. Please slow down and try again.',
      },
    },
  });

  app.use('/api', apiLimiter, questionsRouter(generator));

  // Serve the built client from the same process in production.
  if (config.clientDistPath) {
    const dist = path.resolve(config.clientDistPath);
    app.use(express.static(dist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
