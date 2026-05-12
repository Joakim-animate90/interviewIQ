import { describe, expect, it } from 'vitest';

import { MAX_JOB_TITLE_LENGTH, validateJobTitle } from '../src/lib/validation';

describe('validateJobTitle', () => {
  it('accepts a reasonable job title', () => {
    expect(validateJobTitle('Senior Backend Engineer')).toEqual({ ok: true });
  });

  it('rejects empty/whitespace input', () => {
    expect(validateJobTitle('').ok).toBe(false);
    expect(validateJobTitle('   ').ok).toBe(false);
  });

  it('rejects too-long input', () => {
    expect(validateJobTitle('x'.repeat(MAX_JOB_TITLE_LENGTH + 1)).ok).toBe(false);
  });
});
