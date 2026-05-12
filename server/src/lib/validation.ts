import { ApiError } from './errors.js';

export const MAX_JOB_TITLE_LENGTH = 120;
export const MIN_JOB_TITLE_LENGTH = 2;

// Strip ASCII control chars and DEL to reduce prompt-injection surface.
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F]+', 'g');
const WHITESPACE = /\s+/g;

/**
 * Normalize and validate a job title from untrusted input.
 */
export function normalizeJobTitle(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw ApiError.validation('jobTitle must be a string.');
  }

  const cleaned = raw.replace(CONTROL_CHARS, ' ').replace(WHITESPACE, ' ').trim();

  if (cleaned.length < MIN_JOB_TITLE_LENGTH) {
    throw ApiError.validation('Please provide a job title.');
  }

  if (cleaned.length > MAX_JOB_TITLE_LENGTH) {
    throw ApiError.validation(`Job title must be ${MAX_JOB_TITLE_LENGTH} characters or fewer.`);
  }

  return cleaned;
}
