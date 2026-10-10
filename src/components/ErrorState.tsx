import styles from "./States.module.css";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
}

export function ErrorState({
  title = "We could not load this",
  message = "Check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <div className={styles?.box} role="alert">
      <h2 className={styles?.title}>{title}</h2>
      <p className={styles?.message}>{message}</p>
      {onRetry && (
        <button
          type="button"
          className="button"
          onClick={onRetry}
          disabled={isRetrying}
          aria-busy={isRetrying}
        >
          {isRetrying ? "Retrying…" : retryLabel}
        </button>
      )}
    </div>
  );
}
