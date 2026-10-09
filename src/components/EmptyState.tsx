import type { ReactNode } from "react";
import styles from "./States.module.css";

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className={styles?.box}>
      <h2 className={styles?.title}>{title}</h2>
      {message && <p className={styles?.message}>{message}</p>}
      {action}
    </div>
  );
}
