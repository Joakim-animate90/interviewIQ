import { GoogleGenAI } from '@google/genai';

import type { ServerConfig } from '../config.js';
import { ApiError } from '../lib/errors.js';
import { parseQuestions } from '../lib/parseQuestions.js';
import { RESPONSE_SCHEMA, SYSTEM_INSTRUCTION, buildUserPrompt } from '../lib/prompt.js';

export interface QuestionGenerator {
  generate(jobTitle: string): Promise<string[]>;
}

export function createGeminiQuestionGenerator(config: ServerConfig): QuestionGenerator {
  const client = new GoogleGenAI({ apiKey: config.geminiApiKey });

  return {
    async generate(jobTitle) {
      try {
        const response = await withTimeout(
          client.models.generateContent({
            model: config.geminiModel,
            contents: buildUserPrompt(jobTitle),
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.7,
              responseMimeType: 'application/json',
              responseSchema: RESPONSE_SCHEMA,
            },
          }),
          config.upstreamTimeoutMs,
        );

        const text = response.text;
        if (!text) {
          throw ApiError.parse('AI response did not contain any text.');
        }

        const parsed = parseQuestions(text);
        if (!parsed.valid) {
          throw ApiError.validation(parsed.reason);
        }
        return parsed.questions;
      } catch (err) {
        throw mapGeminiError(err);
      }
    },
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(ApiError.timeout()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function mapGeminiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (lower.includes('rate') || lower.includes('quota') || lower.includes('429')) {
    return ApiError.rateLimited();
  }
  if (lower.includes('abort') || lower.includes('timeout')) {
    return ApiError.timeout();
  }
  return ApiError.upstream(`AI provider error: ${message}`);
}
