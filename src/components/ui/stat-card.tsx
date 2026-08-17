import { cn } from "@/lib/utils/cn";

type StatCardProps = {
  label: string;
  value: string;
  /** Detalle secundario: unidad, media, contexto del periodo. */
  hint?: string;
  className?: string;
};

/**
 * Tarjeta de cifra. La forma correcta para un único número: nunca una gráfica
 * de una sola barra.
 *
 * El valor usa cifras proporcionales (no `tabular-nums`): a tamaño grande, los
 * dígitos de ancho fijo hacen que un número como "121" se vea suelto.
 */
export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-surface border-border rounded-card border p-4",
        className,
      )}
    >
      <p className="text-ink-muted text-xs font-medium">{label}</p>
      <p className="text-ink mt-2 text-2xl font-semibold sm:text-3xl">{value}</p>
      {hint ? <p className="text-ink-secondary mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

type HighlightCardProps = {
  label: string;
  icon: string;
  title: string;
  meta: string;
  value: string;
};

/**
 * Tarjeta ancha para destacar un entrenamiento concreto (el último, el más
 * largo). El icono lleva la identidad de la actividad.
 */
export function HighlightCard({
  label,
  icon,
  title,
  meta,
  value,
}: HighlightCardProps) {
  return (
    <div className="bg-surface border-border rounded-card border p-4">
      <p className="text-ink-muted text-xs font-medium">{label}</p>
      <div className="mt-2.5 flex items-center gap-3">
        <span aria-hidden className="text-2xl leading-none">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate text-base font-semibold">{title}</p>
          <p className="text-ink-secondary truncate text-xs">{meta}</p>
        </div>
        <p className="text-ink shrink-0 text-base font-semibold">{value}</p>
      </div>
    </div>
  );
}
