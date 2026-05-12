import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { ServerConfig } from '../src/config.js';
import { ApiError } from '../src/lib/errors.js';

const generateContentMock = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: { generateContent: generateContentMock },
    })),
  };
});

import { createGeminiQuestionGenerator } from '../src/services/gemini.js';

const config: ServerConfig = {
  port: 0,
  nodeEnv: 'test',
  geminiApiKey: 'k',
  geminiModel: 'gemini-2.0-flash',
  corsOrigins: [],
  upstreamTimeoutMs: 5_000,
  clientDistPath: null,
};

beforeEach(() => {
  generateContentMock.mockReset();
});

describe('createGeminiQuestionGenerator', () => {
  it('returns parsed questions on a valid response', async () => {
    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify({ valid: true, questions: ['A?', 'B?', 'C?'] }),
    });
    const gen = createGeminiQuestionGenerator(config);
    await expect(gen.generate('Backend Engineer')).resolves.toEqual(['A?', 'B?', 'C?']);
  });

  it('rejects with VALIDATION_ERROR when the model decides the input is not a job title', async () => {
    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify({
        valid: false,
        reason: "'asdf' does not look like a job title.",
      }),
    });
    const gen = createGeminiQuestionGenerator(config);
    await expect(gen.generate('asdf')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: "'asdf' does not look like a job title.",
    });
  });

  it('maps rate-limit-shaped errors to ApiError.rateLimited', async () => {
    generateContentMock.mockRejectedValueOnce(new Error('429 rate limit exceeded'));
    const gen = createGeminiQuestionGenerator(config);
    await expect(gen.generate('PM')).rejects.toMatchObject({
      code: 'UPSTREAM_RATE_LIMITED',
    });
  });

  it('maps unknown errors to ApiError.upstream', async () => {
    generateContentMock.mockRejectedValueOnce(new Error('connection refused'));
    const gen = createGeminiQuestionGenerator(config);
    await expect(gen.generate('PM')).rejects.toMatchObject({ code: 'UPSTREAM_ERROR' });
  });

  it('throws parse error on empty response', async () => {
    generateContentMock.mockResolvedValueOnce({ text: '' });
    const gen = createGeminiQuestionGenerator(config);
    await expect(gen.generate('PM')).rejects.toBeInstanceOf(ApiError);
  });

  it('times out long-running upstream calls', async () => {
    generateContentMock.mockImplementationOnce(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );
    const gen = createGeminiQuestionGenerator({ ...config, upstreamTimeoutMs: 50 });
    await expect(gen.generate('PM')).rejects.toMatchObject({ code: 'UPSTREAM_TIMEOUT' });
  });
});
