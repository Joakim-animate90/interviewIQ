import { describe, expect, it } from 'vitest';

import { parseQuestions } from '../src/lib/parseQuestions.js';

describe('parseQuestions', () => {
  it('parses a valid response with 3 questions', () => {
    const raw = JSON.stringify({ valid: true, questions: ['A?', 'B?', 'C?'] });
    expect(parseQuestions(raw)).toEqual({ valid: true, questions: ['A?', 'B?', 'C?'] });
  });

  it('parses a response wrapped in markdown/code fencing', () => {
    const raw = '```json\n{"valid":true,"questions":["A?","B?","C?"]}\n```';
    expect(parseQuestions(raw)).toEqual({ valid: true, questions: ['A?', 'B?', 'C?'] });
  });

  it('parses a response with surrounding prose', () => {
    const raw = 'Here you go:\n{"valid":true,"questions":["A?","B?","C?"]}\nLet me know.';
    expect(parseQuestions(raw)).toEqual({ valid: true, questions: ['A?', 'B?', 'C?'] });
  });

  it('parses an invalid-input rejection with reason', () => {
    const raw = JSON.stringify({
      valid: false,
      reason: "'asdf' does not look like a job title.",
    });
    expect(parseQuestions(raw)).toEqual({
      valid: false,
      reason: "'asdf' does not look like a job title.",
    });
  });

  it('falls back to a friendly default reason when invalid result omits one', () => {
    const raw = JSON.stringify({ valid: false });
    expect(parseQuestions(raw)).toEqual({
      valid: false,
      reason: "That doesn't look like a job title.",
    });
  });

  it('treats legacy bare list response as a valid 3-question result', () => {
    const raw = '1. First question?\n2. Second question?\n3. Third question?';
    expect(parseQuestions(raw)).toEqual({
      valid: true,
      questions: ['First question?', 'Second question?', 'Third question?'],
    });
  });

  it('throws on empty input', () => {
    expect(() => parseQuestions('   ')).toThrowError(/empty/i);
  });

  it('throws when valid is true but questions count is wrong', () => {
    const raw = JSON.stringify({ valid: true, questions: ['only one'] });
    expect(() => parseQuestions(raw)).toThrow();
  });

  it('throws when questions array contains non-strings', () => {
    const raw = JSON.stringify({ valid: true, questions: ['ok', 42, 'ok'] });
    expect(() => parseQuestions(raw)).toThrow();
  });

  it('throws when response is unparseable garbage', () => {
    expect(() => parseQuestions('this is not json or a list at all')).toThrow();
  });
});
