import { formatDuration } from "@/lib/date/format";

export type DistributionItem = {
  key: string;
  /** Emoji de la actividad. Es quien lleva la identidad, no el color. */
  icon?: string;
  label: string;
  count: number;
  totalSeconds: number;
};

type DistributionListProps = {
  items: DistributionItem[];
};

/**
 * Reparto de entrenamientos por categoría: número, tiempo y una barra con la
 * proporción.
 *
 * Se usa una lista de barras horizontales en lugar de un donut porque los
 * nombres son largos y comparar longitudes es más preciso que comparar
 * ángulos. Todas las barras comparten color: la categoría la dice su etiqueta,
 * que va justo al lado, así que no hace falta gastar color en identificarlas.
 */
export function DistributionList({ items }: DistributionListProps) {
  const maxCount = items.reduce((max, item) => Math.max(max, item.count), 0);
  if (maxCount === 0) return null;

  return (
    <ul className="space-y-3.5">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1.5 flex items-baseline gap-2">
            {item.icon ? (
              <span aria-hidden className="text-sm leading-none">
                {item.icon}
              </span>
            ) : null}
            <span className="text-ink flex-1 truncate text-sm font-medium">
              {item.label}
            </span>
            <span className="text-ink text-sm font-semibold tabular-nums">
              {item.count}
            </span>
            <span className="text-ink-muted w-20 text-right text-xs tabular-nums">
              {formatDuration(item.totalSeconds)}
            </span>
          </div>

          <div
            className="bg-surface-raised h-1.5 w-full overflow-hidden rounded-full"
            role="img"
            aria-label={`${item.label}: ${item.count} entrenamientos, ${formatDuration(item.totalSeconds)}`}
          >
            <div
              className="bg-accent h-full rounded-full"
              style={{ width: `${Math.max(4, (item.count / maxCount) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
