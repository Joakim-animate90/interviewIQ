import { ApiError } from './errors.js';

const EXPECTED_COUNT = 3;

/**
 * Robustly parse Gemini's text output into exactly 3 question strings.
 *
 * Strategy (in order):
 *   1. Direct JSON.parse (schema-constrained responses land here).
 *   2. Extract the first {...} block and parse that (model added prose).
 *   3. Numbered/bulleted list fallback (rare malformed output).
 *
 * If none yield exactly 3 non-empty strings, throw ApiError.parse().
 */
export function parseQuestions(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw ApiError.parse('AI response was empty.');
  }

  const fromJson = tryJson(trimmed) ?? tryJsonBlock(trimmed);
  if (fromJson) return fromJson;

  const fromList = tryList(trimmed);
  if (fromList) return fromList;

  throw ApiError.parse();
}

function tryJson(text: string): string[] | null {
  try {
    return validateQuestions(JSON.parse(text));
  } catch {
    return null;
  }
}

function tryJsonBlock(text: string): string[] | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return validateQuestions(JSON.parse(text.slice(start, end + 1)));
  } catch {
    return null;
  }
}

function tryList(text: string): string[] | null {
  const lines = text
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
  if (lines.length < EXPECTED_COUNT) return null;
  const candidate = lines.slice(0, EXPECTED_COUNT);
  return candidate.every((line) => line.length > 0) ? candidate : null;
}

function validateQuestions(value: unknown): string[] | null {
  if (!value || typeof value !== 'object') return null;
  const questions = (value as { questions?: unknown }).questions;
  if (!Array.isArray(questions) || questions.length !== EXPECTED_COUNT) return null;
  const strings = questions.map((q) => (typeof q === 'string' ? q.trim() : ''));
  return strings.every((q) => q.length > 0) ? strings : null;
}
