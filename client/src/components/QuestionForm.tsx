import { useId, useState, type FormEvent } from 'react';

import { MAX_JOB_TITLE_LENGTH, validateJobTitle } from '../lib/validation';

import { Spinner } from './Spinner';

interface QuestionFormProps {
  onSubmit: (jobTitle: string) => void;
  isLoading: boolean;
}

export function QuestionForm({ onSubmit, isLoading }: QuestionFormProps): JSX.Element {
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const validation = validateJobTitle(value);
  const showError = touched && !validation.ok;

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setTouched(true);
    if (!validation.ok || isLoading) return;
    onSubmit(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-800">
        Job title
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          name="jobTitle"
          type="text"
          inputMode="text"
          autoComplete="off"
          placeholder="e.g. Senior Backend Engineer"
          maxLength={MAX_JOB_TITLE_LENGTH}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={isLoading}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? errorId : undefined}
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
        />
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isLoading ? <Spinner label="Generating" /> : null}
          {isLoading ? 'Generating' : 'Generate questions'}
        </button>
      </div>
      {showError ? (
        <p id={errorId} className="text-xs text-red-700">
          {validation.message}
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          We only send the job title to the model. No personal data is included.
        </p>
      )}
    </form>
  );
}
