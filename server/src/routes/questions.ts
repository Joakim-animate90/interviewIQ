// @ts-ignore: Express package types are unavailable
import { Router, type Request, type Response, type NextFunction } from 'express';

import { normalizeJobTitle } from '../lib/validation.js';
import type { QuestionGenerator } from '../services/gemini.js';
import type { QuestionsResponse } from '../types/index.js';

export function questionsRouter(generator: QuestionGenerator): Router {
  const router = Router();

  router.post(
    '/questions',
    async (req: Request, res: Response<QuestionsResponse>, next: NextFunction) => {
      try {
        const jobTitle = normalizeJobTitle(req.body?.jobTitle);
        const questions = await generator.generate(jobTitle);
        res.status(200).json({ questions });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
