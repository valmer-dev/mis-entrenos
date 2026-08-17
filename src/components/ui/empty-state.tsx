import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

/**
 * Estado vacío. Se muestra en lugar de las gráficas cuando todavía no hay
 * datos: una gráfica a cero no informa de nada y desconcierta.
 */
export function EmptyState({
  icon = "💪",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="border-border bg-surface rounded-card flex flex-col items-center border border-dashed px-6 py-12 text-center">
      <span aria-hidden className="text-4xl">
        {icon}
      </span>
      <h2 className="text-ink mt-4 text-lg font-semibold text-balance">
        {title}
      </h2>
      <p className="text-ink-secondary mt-2 max-w-xs text-sm text-pretty">
        {description}
      </p>
      {action ? <div className="mt-6 w-full max-w-xs">{action}</div> : null}
    </div>
  );
}
