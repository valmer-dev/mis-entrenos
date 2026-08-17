import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { formatFullDate, formatStopwatch, formatTimeOfDay } from "@/lib/date/format";
import { getUserTimeZone } from "@/lib/date/timezone";
import {
  workoutSubtitle,
  workoutTitle,
  workoutTypeIcon,
} from "@/lib/domain/workout";
import { getWorkoutById } from "@/lib/workouts/queries";

export const metadata: Metadata = {
  title: "Entrenamiento completado",
};

export const dynamic = "force-dynamic";

/**
 * Confirmación tras finalizar un entrenamiento.
 *
 * Lee el entrenamiento ya guardado en Supabase (no recibe los datos por la
 * URL), así que lo que se muestra es exactamente lo que ha quedado registrado.
 */
export default async function WorkoutCompletedPage({
  params,
}: PageProps<"/entrenar/completado/[id]">) {
  const { id } = await params;
  const workout = await getWorkoutById(id);

  if (!workout || !workout.finished_at) notFound();

  const timeZone = await getUserTimeZone();
  const startedAt = new Date(workout.started_at);
  const finishedAt = new Date(workout.finished_at);
  const subtitle = workoutSubtitle(workout);

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <span
        aria-hidden
        className="border-accent/40 bg-accent/10 flex h-16 w-16 items-center justify-center rounded-full border"
      >
        <svg
          viewBox="0 0 24 24"
          className="text-accent h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m4.5 12.5 5 5 10-11" />
        </svg>
      </span>

      <h1 className="text-ink mt-6 text-2xl font-semibold tracking-tight">
        Entrenamiento completado
      </h1>

      <div className="mt-8 flex items-center gap-3">
        <span aria-hidden className="text-3xl">
          {workoutTypeIcon(workout.type)}
        </span>
        <div className="text-left">
          {subtitle ? (
            <p className="text-ink-muted text-xs font-semibold tracking-[0.2em] uppercase">
              {subtitle}
            </p>
          ) : null}
          <p className="text-ink text-xl font-semibold">
            {workoutTitle(workout)}
          </p>
        </div>
      </div>

      <p className="text-ink-muted mt-10 text-xs font-medium">Duración</p>
      <p className="text-ink mt-1 text-5xl font-semibold tabular-nums">
        {formatStopwatch(workout.duration_seconds ?? 0)}
      </p>

      <p className="text-ink-secondary mt-6 text-sm">
        {formatFullDate(startedAt, timeZone)}
      </p>
      <p className="text-ink-muted text-sm">
        {formatTimeOfDay(startedAt, timeZone)} –{" "}
        {formatTimeOfDay(finishedAt, timeZone)}
      </p>

      {workout.notes ? (
        <p className="border-border bg-surface text-ink-secondary mt-6 max-w-sm rounded-2xl border px-4 py-3 text-left text-sm text-pretty">
          {workout.notes}
        </p>
      ) : null}

      <div className="mt-10 w-full max-w-sm space-y-3">
        <ButtonLink href="/dashboard" size="hero">
          VOLVER AL DASHBOARD
        </ButtonLink>
        <ButtonLink
          href={`/historico/${workout.id}`}
          variant="ghost"
          size="md"
          className="w-full"
        >
          Ver detalle
        </ButtonLink>
      </div>
    </div>
  );
}
