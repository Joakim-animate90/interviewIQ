import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import type { ServerConfig } from '../src/config.js';
import { ApiError } from '../src/lib/errors.js';
import type { QuestionGenerator } from '../src/services/gemini.js';

const baseConfig: ServerConfig = {
  port: 0,
  nodeEnv: 'test',
  geminiApiKey: 'test-key',
  geminiModel: 'gemini-2.0-flash',
  corsOrigins: [],
  upstreamTimeoutMs: 1000,
  clientDistPath: null,
};

function makeApp(generator: QuestionGenerator) {
  return createApp({ config: baseConfig, generator });
}

describe('POST /api/questions', () => {
  it('returns 3 questions on success', async () => {
    const generator: QuestionGenerator = {
      generate: vi.fn().mockResolvedValue(['Q1?', 'Q2?', 'Q3?']),
    };

    const res = await request(makeApp(generator))
      .post('/api/questions')
      .send({ jobTitle: 'Senior Backend Engineer' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ questions: ['Q1?', 'Q2?', 'Q3?'] });
    expect(generator.generate).toHaveBeenCalledWith('Senior Backend Engineer');
  });

  it('rejects empty job title with 400', async () => {
    const generator: QuestionGenerator = { generate: vi.fn() };

    const res = await request(makeApp(generator))
      .post('/api/questions')
      .send({ jobTitle: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(generator.generate).not.toHaveBeenCalled();
  });

  it('rejects missing body with 400', async () => {
    const generator: QuestionGenerator = { generate: vi.fn() };

    const res = await request(makeApp(generator)).post('/api/questions').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('maps upstream timeout to 504', async () => {
    const generator: QuestionGenerator = {
      generate: vi.fn().mockRejectedValue(ApiError.timeout()),
    };

    const res = await request(makeApp(generator))
      .post('/api/questions')
      .send({ jobTitle: 'Designer' });

    expect(res.status).toBe(504);
    expect(res.body.error.code).toBe('UPSTREAM_TIMEOUT');
  });

  it('maps upstream rate limit to 429', async () => {
    const generator: QuestionGenerator = {
      generate: vi.fn().mockRejectedValue(ApiError.rateLimited()),
    };

    const res = await request(makeApp(generator))
      .post('/api/questions')
      .send({ jobTitle: 'PM' });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('UPSTREAM_RATE_LIMITED');
  });

  it('maps parse errors to 502', async () => {
    const generator: QuestionGenerator = {
      generate: vi.fn().mockRejectedValue(ApiError.parse()),
    };

    const res = await request(makeApp(generator))
      .post('/api/questions')
      .send({ jobTitle: 'PM' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('PARSE_ERROR');
  });

  it('returns 500 for unknown errors and does not leak details', async () => {
    const generator: QuestionGenerator = {
      generate: vi.fn().mockRejectedValue(new Error('boom: secret-detail')),
    };

    const res = await request(makeApp(generator))
      .post('/api/questions')
      .send({ jobTitle: 'PM' });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('secret-detail');
  });

  it('exposes a health endpoint', async () => {
    const generator: QuestionGenerator = { generate: vi.fn() };
    const res = await request(makeApp(generator)).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
