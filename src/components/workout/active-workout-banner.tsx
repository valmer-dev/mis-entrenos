"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { formatStopwatch } from "@/lib/date/format";
import type { GymType, WorkoutType } from "@/lib/domain/workout";
import { workoutTitle, workoutTypeIcon } from "@/lib/domain/workout";
import { useElapsedSeconds } from "@/lib/hooks/use-elapsed-seconds";

type ActiveWorkoutBannerProps = {
  workout: {
    type: WorkoutType;
    gym_type: GymType | null;
    started_at: string;
  };
};

/**
 * Aviso persistente de que hay un entrenamiento en marcha.
 *
 * Aparece en todas las pantallas menos en la propia de entrenamiento, donde el
 * cronómetro ya es el protagonista.
 */
export function ActiveWorkoutBanner({ workout }: ActiveWorkoutBannerProps) {
  const pathname = usePathname();
  const elapsed = useElapsedSeconds(workout.started_at);

  if (pathname.startsWith("/entrenar")) return null;

  return (
    <Link
      href="/entrenar"
      className="border-accent/40 bg-accent/10 hover:bg-accent/15 mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors"
    >
      <span
        aria-hidden
        className="bg-accent h-2 w-2 shrink-0 animate-pulse rounded-full"
      />
      <span aria-hidden className="text-lg leading-none">
        {workoutTypeIcon(workout.type)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-ink block truncate text-sm font-semibold">
          {workoutTitle(workout)} en curso
        </span>
        <span className="text-ink-secondary block text-xs">
          Toca para continuar
        </span>
      </span>
      <span
        suppressHydrationWarning
        className="text-ink shrink-0 text-base font-semibold tabular-nums"
      >
        {formatStopwatch(elapsed)}
      </span>
    </Link>
  );
}
