import { describe, expect, it } from 'vitest';

import { parseQuestions } from '../src/lib/parseQuestions.js';

describe('parseQuestions', () => {
  it('parses well-formed JSON', () => {
    const raw = JSON.stringify({ questions: ['A?', 'B?', 'C?'] });
    expect(parseQuestions(raw)).toEqual(['A?', 'B?', 'C?']);
  });

  it('parses JSON wrapped in markdown/code fencing', () => {
    const raw = '```json\n{"questions":["A?","B?","C?"]}\n```';
    expect(parseQuestions(raw)).toEqual(['A?', 'B?', 'C?']);
  });

  it('parses JSON with surrounding prose', () => {
    const raw = 'Here you go:\n{"questions":["A?","B?","C?"]}\nLet me know.';
    expect(parseQuestions(raw)).toEqual(['A?', 'B?', 'C?']);
  });

  it('falls back to numbered list when JSON is missing', () => {
    const raw = '1. First question?\n2. Second question?\n3. Third question?';
    expect(parseQuestions(raw)).toEqual([
      'First question?',
      'Second question?',
      'Third question?',
    ]);
  });

  it('falls back to bullet list', () => {
    const raw = '- One?\n- Two?\n- Three?';
    expect(parseQuestions(raw)).toEqual(['One?', 'Two?', 'Three?']);
  });

  it('throws on empty input', () => {
    expect(() => parseQuestions('   ')).toThrowError(/empty/i);
  });

  it('throws when count is not exactly three', () => {
    const raw = JSON.stringify({ questions: ['only one'] });
    expect(() => parseQuestions(raw)).toThrow();
  });

  it('throws when questions array contains non-strings', () => {
    const raw = JSON.stringify({ questions: ['ok', 42, 'ok'] });
    expect(() => parseQuestions(raw)).toThrow();
  });

  it('throws when response is unparseable garbage', () => {
    expect(() => parseQuestions('this is not json or a list at all')).toThrow();
  });
});
