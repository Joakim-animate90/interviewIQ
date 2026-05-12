interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps): JSX.Element {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <p className="leading-snug">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-900 hover:bg-red-200 focus-visible:bg-red-200"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
