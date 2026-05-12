import type { ApiErrorCode } from '../types/index.js';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }

  static validation(message: string): ApiError {
    return new ApiError('VALIDATION_ERROR', message, 400);
  }

  static upstream(message = 'Upstream AI provider returned an error.'): ApiError {
    return new ApiError('UPSTREAM_ERROR', message, 502);
  }

  static timeout(message = 'Upstream AI provider timed out.'): ApiError {
    return new ApiError('UPSTREAM_TIMEOUT', message, 504);
  }

  static rateLimited(message = 'AI provider rate limit reached. Please try again shortly.'): ApiError {
    return new ApiError('UPSTREAM_RATE_LIMITED', message, 429);
  }

  static parse(message = 'AI response could not be parsed.'): ApiError {
    return new ApiError('PARSE_ERROR', message, 502);
  }
}
