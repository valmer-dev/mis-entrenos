import { formatDuration } from "@/lib/date/format";
import type { ActivityBucket } from "@/lib/stats/dashboard";
import { cn } from "@/lib/utils/cn";

type ActivityBarChartProps = {
  buckets: ActivityBucket[];
  maxCount: number;
};

/** Por encima de este número de barras las etiquetas sobre la barra estorban. */
const DIRECT_LABEL_LIMIT = 8;

/**
 * Actividad a lo largo del periodo.
 *
 * Una sola serie (número de entrenamientos), así que un único color y sin
 * leyenda: el título ya dice qué se está midiendo. Las barras van separadas por
 * un hueco del color del fondo en lugar de por bordes, y la línea base es un
 * filete de 1px que no compite con los datos.
 *
 * Los valores se escriben sobre la barra cuando hay pocas, y siempre están
 * disponibles en la tabla de datos: nunca dependen de un tooltip.
 */
export function ActivityBarChart({ buckets, maxCount }: ActivityBarChartProps) {
  // Con un máximo de 1 la barra ocuparía todo el alto y parecería un "lleno".
  const scale = Math.max(maxCount, 2);
  const showDirectLabels = buckets.length <= DIRECT_LABEL_LIMIT;

  return (
    <figure className="m-0">
      <div className="flex items-stretch gap-[2px]" role="presentation">
        {buckets.map((bucket) => {
          const heightPercent =
            bucket.count === 0 ? 0 : (bucket.count / scale) * 100;

          return (
            <div
              key={bucket.key}
              className="flex min-w-0 flex-1 flex-col items-center"
              title={`${bucket.fullLabel}: ${bucket.count} · ${formatDuration(bucket.totalSeconds)}`}
            >
              {showDirectLabels ? (
                <span
                  className={cn(
                    "mb-1.5 h-4 text-[11px] font-semibold",
                    bucket.count > 0 ? "text-ink-secondary" : "text-transparent",
                  )}
                >
                  {bucket.count > 0 ? bucket.count : "0"}
                </span>
              ) : null}

              <div className="flex h-24 w-full items-end justify-center sm:h-28">
                <div
                  className={cn(
                    "w-full max-w-6 rounded-t-[4px]",
                    bucket.count > 0 ? "bg-accent" : "bg-border",
                  )}
                  style={{
                    // Las barras a cero conservan un trazo mínimo para que el
                    // día siga estando presente en la gráfica.
                    height: bucket.count === 0 ? "2px" : `max(4px, ${heightPercent}%)`,
                  }}
                />
              </div>

              <span
                className={cn(
                  "border-border mt-0 w-full border-t pt-2 text-center text-[11px]",
                  bucket.isCurrent
                    ? "text-ink font-semibold"
                    : "text-ink-muted",
                )}
              >
                {bucket.label}
              </span>
            </div>
          );
        })}
      </div>

      <details className="group mt-4">
        <summary className="text-ink-muted hover:text-ink-secondary cursor-pointer list-none text-xs font-medium">
          <span className="group-open:hidden">Ver datos</span>
          <span className="hidden group-open:inline">Ocultar datos</span>
        </summary>

        <table className="mt-3 w-full text-left text-xs">
          <thead>
            <tr className="text-ink-muted">
              <th scope="col" className="pb-2 font-medium">
                Periodo
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Entrenos
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Tiempo
              </th>
            </tr>
          </thead>
          <tbody className="text-ink-secondary">
            {buckets.map((bucket) => (
              <tr key={bucket.key} className="border-border border-t">
                <th scope="row" className="py-1.5 font-normal">
                  {bucket.fullLabel}
                </th>
                <td className="py-1.5 text-right tabular-nums">
                  {bucket.count}
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {bucket.count > 0 ? formatDuration(bucket.totalSeconds) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
