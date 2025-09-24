import type { ReactNode } from "react";

type AsyncBoundaryProps = {
  isLoading: boolean;
  error: string;
  isEmpty: boolean;
  loadingMessage?: string;
  errorMessage?: string;
  emptyMessage?: string;
  emptyVariant?: "default" | "inline";
  onRetry?: () => void;
  children: ReactNode;
};

export function AsyncBoundary({
  isLoading,
  error,
  isEmpty,
  loadingMessage = "Loading...",
  errorMessage = "Error",
  emptyMessage = "No items available",
  emptyVariant = "default",
  onRetry,
  children,
}: AsyncBoundaryProps) {
  if (isLoading) {
    return <div className="app-status">{loadingMessage}</div>;
  }

  if (error) {
    return (
      <div className="app-status" role="alert">
        {errorMessage}: {error}
        {onRetry ? (
          <div className="app-status__actions">
            <button type="button" className="app-status__button" onClick={onRetry}>
              Retry
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (isEmpty) {
    const statusClassName = emptyVariant === "inline" ? "app-status app-status--inline" : "app-status";
    return <div className={statusClassName}>{emptyMessage}</div>;
  }

  return <>{children}</>;
}
