import type { ApiErrorCode, ApiErrorPayload, QuestionsResponse } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = 20_000;

export class ApiClientError extends Error {
  public readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiClientError';
  }
}

export interface GenerateOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function generateQuestions(
  jobTitle: string,
  options: GenerateOptions = {},
): Promise<string[]> {
  const url = `${API_BASE_URL}/api/questions`;
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const linkedSignal = linkSignals(controller.signal, options.signal);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobTitle }),
      signal: linkedSignal,
    });

    const body = (await safeJson(res)) as Partial<QuestionsResponse & { error: ApiErrorPayload }>;

    if (!res.ok) {
      const code = body?.error?.code ?? 'INTERNAL_ERROR';
      const message = body?.error?.message ?? defaultMessageFor(code);
      throw new ApiClientError(code, message);
    }

    if (!body?.questions || !Array.isArray(body.questions) || body.questions.length !== 3) {
      throw new ApiClientError('PARSE_ERROR', 'Unexpected response from server.');
    }

    return body.questions;
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    if (isAbortError(err)) {
      throw new ApiClientError('UPSTREAM_TIMEOUT', 'Request timed out. Please try again.');
    }
    throw new ApiClientError('NETWORK_ERROR', 'Could not reach the server. Check your connection.');
  } finally {
    clearTimeout(timer);
  }
}

function defaultMessageFor(code: ApiErrorCode): string {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.';
    case 'UPSTREAM_RATE_LIMITED':
      return 'Too many requests. Please wait a moment and try again.';
    case 'UPSTREAM_TIMEOUT':
      return 'The AI took too long to respond. Please try again.';
    case 'PARSE_ERROR':
      return 'The AI returned an unexpected response. Please try again.';
    case 'NETWORK_ERROR':
      return 'Could not reach the server.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function linkSignals(a: AbortSignal, b?: AbortSignal): AbortSignal {
  if (!b) return a;
  const controller = new AbortController();
  const abort = (): void => controller.abort();
  if (a.aborted || b.aborted) controller.abort();
  a.addEventListener('abort', abort, { once: true });
  b.addEventListener('abort', abort, { once: true });
  return controller.signal;
}
