import { ApiError } from './errors.js';

const EXPECTED_COUNT = 3;

export type ParsedQuestionsResult =
  | { valid: true; questions: string[] }
  | { valid: false; reason: string };

/**
 * Robustly parse Gemini's text output into either an invalid-input signal
 * or exactly 3 question strings.
 *
 * Strategy (in order):
 *   1. Direct JSON.parse (schema-constrained responses land here).
 *   2. Extract the first {...} block and parse that (model added prose).
 *   3. Numbered/bulleted list fallback (legacy free-text responses).
 *
 * Throws ApiError.parse() when none of the above yield a valid shape.
 */
export function parseQuestions(raw: string): ParsedQuestionsResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw ApiError.parse('AI response was empty.');
  }

  const fromJson = tryJson(trimmed) ?? tryJsonBlock(trimmed);
  if (fromJson) return fromJson;

  const fromList = tryList(trimmed);
  if (fromList) return { valid: true, questions: fromList };

  throw ApiError.parse();
}

function tryJson(text: string): ParsedQuestionsResult | null {
  try {
    return validateShape(JSON.parse(text));
  } catch {
    return null;
  }
}

function tryJsonBlock(text: string): ParsedQuestionsResult | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return validateShape(JSON.parse(text.slice(start, end + 1)));
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

function validateShape(value: unknown): ParsedQuestionsResult | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as { valid?: unknown; reason?: unknown; questions?: unknown };

  if (obj.valid === false) {
    const reason =
      typeof obj.reason === 'string' && obj.reason.trim().length > 0
        ? obj.reason.trim()
        : "That doesn't look like a job title.";
    return { valid: false, reason };
  }

  // Treat a missing/true `valid` as "trying to provide questions".
  if (Array.isArray(obj.questions) && obj.questions.length === EXPECTED_COUNT) {
    const strings = obj.questions.map((q) => (typeof q === 'string' ? q.trim() : ''));
    if (strings.every((q) => q.length > 0)) {
      return { valid: true, questions: strings };
    }
  }

  return null;
}
