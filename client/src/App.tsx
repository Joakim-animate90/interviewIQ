import { useCallback, useRef, useState } from 'react';

import { ErrorBanner } from './components/ErrorBanner';
import { QuestionForm } from './components/QuestionForm';
import { QuestionList } from './components/QuestionList';
import { ApiClientError, generateQuestions } from './services/api';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; jobTitle: string; questions: string[] }
  | { kind: 'error'; message: string };

export default function App(): JSX.Element {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const lastSubmissionRef = useRef<string | null>(null);
  const inFlightRef = useRef<AbortController | null>(null);

  const submit = useCallback(async (jobTitle: string) => {
    lastSubmissionRef.current = jobTitle;
    inFlightRef.current?.abort();
    const controller = new AbortController();
    inFlightRef.current = controller;

    setStatus({ kind: 'loading' });
    try {
      const questions = await generateQuestions(jobTitle, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setStatus({ kind: 'success', jobTitle, questions });
    } catch (err) {
      if (controller.signal.aborted) return;
      const message =
        err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.';
      setStatus({ kind: 'error', message });
    }
  }, []);

  const handleRetry = useCallback(() => {
    const last = lastSubmissionRef.current;
    if (last) void submit(last);
  }, [submit]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12 sm:py-16">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          InterviewIQ
        </p>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Generate thoughtful interview questions
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">
          Enter a job title and we&rsquo;ll draft three role-specific interview questions you can
          take into your next conversation.
        </p>
      </header>

      <QuestionForm onSubmit={(jobTitle) => void submit(jobTitle)} isLoading={status.kind === 'loading'} />

      <section aria-live="polite" className="min-h-[1.5rem]">
        {status.kind === 'loading' ? (
          <p className="text-sm text-slate-600">Thinking through {lastSubmissionRef.current}…</p>
        ) : null}

        {status.kind === 'error' ? (
          <ErrorBanner message={status.message} onRetry={lastSubmissionRef.current ? handleRetry : undefined} />
        ) : null}

        {status.kind === 'success' ? (
          <QuestionList jobTitle={status.jobTitle} questions={status.questions} />
        ) : null}
      </section>

      <footer className="mt-auto pt-8 text-xs text-slate-400">
        Powered by Google Gemini &middot; questions are AI-generated &mdash; always review before use.
      </footer>
    </main>
  );
}
