import type { ErrorRequestHandler } from 'express';

import { ApiError } from '../lib/errors.js';
import type { ApiErrorBody } from '../types/index.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    const body: ApiErrorBody = {
      error: { code: err.code, message: err.message },
    };
    res.status(err.status).json(body);
    return;
  }

  // Unknown error — log a redacted message but never the env or stack to the client.
  console.error('[unhandled error]', err instanceof Error ? err.message : err);

  const body: ApiErrorBody = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
    },
  };
  res.status(500).json(body);
};
