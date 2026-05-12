import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError, generateQuestions } from '../src/services/api';

const originalFetch = global.fetch;

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

beforeEach(() => {
  // Default to a happy fetch; individual tests can override.
  global.fetch = vi.fn() as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.useRealTimers();
});

describe('generateQuestions', () => {
  it('returns 3 questions on success', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({ questions: ['A?', 'B?', 'C?'] }, { status: 200 }),
    );

    const result = await generateQuestions('Designer');
    expect(result).toEqual(['A?', 'B?', 'C?']);
  });

  it('throws ApiClientError with server error code on 4xx', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(
        { error: { code: 'VALIDATION_ERROR', message: 'Please provide a job title.' } },
        { status: 400 },
      ),
    );

    await expect(generateQuestions(' ')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Please provide a job title.',
    });
  });

  it('maps network failures to NETWORK_ERROR', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new TypeError('fetch failed'));

    await expect(generateQuestions('PM')).rejects.toBeInstanceOf(ApiClientError);
    await expect(generateQuestions('PM')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('throws PARSE_ERROR when payload is malformed', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({ questions: ['only one'] }, { status: 200 }),
    );

    await expect(generateQuestions('PM')).rejects.toMatchObject({ code: 'PARSE_ERROR' });
  });

  it('maps client-side timeout (aborted) to UPSTREAM_TIMEOUT', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce((_url, init) => {
      return new Promise((_resolve, reject) => {
        (init as RequestInit).signal?.addEventListener('abort', () => {
          const err = new DOMException('Aborted', 'AbortError');
          reject(err);
        });
      });
    });

    await expect(generateQuestions('PM', { timeoutMs: 5 })).rejects.toMatchObject({
      code: 'UPSTREAM_TIMEOUT',
    });
  });
});
