export const MAX_JOB_TITLE_LENGTH = 120;

export interface ValidationResult {
  ok: boolean;
  message?: string;
}

export function validateJobTitle(value: string): ValidationResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: 'Please enter a job title.' };
  }
  if (trimmed.length > MAX_JOB_TITLE_LENGTH) {
    return { ok: false, message: `Keep it under ${MAX_JOB_TITLE_LENGTH} characters.` };
  }
  return { ok: true };
}
