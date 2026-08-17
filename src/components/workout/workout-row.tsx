import Link from "next/link";

import { formatDuration } from "@/lib/date/format";
import type { GymType, WorkoutType } from "@/lib/domain/workout";
import { workoutTitle, workoutTypeIcon } from "@/lib/domain/workout";

type WorkoutRowProps = {
  workout: {
    id: string;
    type: WorkoutType;
    gym_type: GymType | null;
    duration_seconds: number | null;
  };
  /** Línea secundaria: fecha relativa, hora de inicio… según la pantalla. */
  meta: string;
};

/**
 * Fila de entrenamiento, compartida por el resumen del dashboard y el
 * histórico. Toda la fila es un enlace al detalle, para no tener que acertar
 * en un objetivo pequeño con el móvil en la mano.
 */
export function WorkoutRow({ workout, meta }: WorkoutRowProps) {
  return (
    <Link
      href={`/historico/${workout.id}`}
      className="hover:bg-surface-raised -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors"
    >
      <span aria-hidden className="text-xl leading-none">
        {workoutTypeIcon(workout.type)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="text-ink block truncate text-sm font-semibold">
          {workoutTitle(workout)}
        </span>
        <span className="text-ink-muted block truncate text-xs">{meta}</span>
      </span>

      <span className="text-ink shrink-0 text-sm font-semibold tabular-nums">
        {formatDuration(workout.duration_seconds)}
      </span>

      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="text-ink-muted h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </Link>
  );
}
