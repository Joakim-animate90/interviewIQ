interface QuestionListProps {
  jobTitle: string;
  questions: string[];
}

export function QuestionList({ jobTitle, questions }: QuestionListProps): JSX.Element {
  return (
    <section aria-labelledby="questions-heading" className="space-y-4">
      <h2 id="questions-heading" className="text-base font-semibold text-slate-900">
        Interview questions for{' '}
        <span className="font-bold text-slate-950">{jobTitle}</span>
      </h2>
      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li
            key={i}
            className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white"
            >
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-slate-800">{q}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
