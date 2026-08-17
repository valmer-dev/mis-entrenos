import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { DeleteWorkoutButton } from "@/components/workout/delete-workout-button";
import {
  formatCivilDate,
  formatDuration,
  formatFullDate,
  formatStopwatch,
  formatTimeOfDay,
} from "@/lib/date/format";
import { toCivilDate } from "@/lib/date/civil";
import { getUserTimeZone } from "@/lib/date/timezone";
import {
  gymTypeLabel,
  workoutTypeIcon,
  workoutTypeLabel,
} from "@/lib/domain/workout";
import { getWorkoutById } from "@/lib/workouts/queries";

export const metadata: Metadata = {
  title: "Entrenamiento",
};

export const dynamic = "force-dynamic";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border flex items-baseline justify-between gap-4 border-t py-3 first:border-t-0 first:pt-0">
      <dt className="text-ink-muted text-sm">{label}</dt>
      <dd className="text-ink text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

export default async function WorkoutDetailPage({
  params,
}: PageProps<"/historico/[id]">) {
  const { id } = await params;
  const workout = await getWorkoutById(id);

  if (!workout) notFound();

  // Un entrenamiento sin terminar no tiene detalle que enseñar: es el que está
  // corriendo ahora mismo.
  if (!workout.finished_at) redirect("/entrenar");

  const timeZone = await getUserTimeZone();
  const startedAt = new Date(workout.started_at);
  const finishedAt = new Date(workout.finished_at);

  return (
    <div className="space-y-6">
      <Link
        href="/historico"
        className="text-ink-muted hover:text-ink inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 6-6 6 6 6" />
        </svg>
        Histórico
      </Link>

      <header className="flex items-center gap-4">
        <span aria-hidden className="text-4xl leading-none">
          {workoutTypeIcon(workout.type)}
        </span>
        <div className="min-w-0">
          <p className="text-ink-muted text-xs font-semibold tracking-[0.2em] uppercase">
            {workoutTypeLabel(workout.type)}
          </p>
          <h1 className="text-ink text-2xl font-semibold tracking-tight">
            {workout.gym_type
              ? gymTypeLabel(workout.gym_type)
              : workoutTypeLabel(workout.type)}
          </h1>
          <p className="text-ink-secondary mt-0.5 text-sm">
            {formatFullDate(startedAt, timeZone)}
          </p>
        </div>
      </header>

      <Card>
        <p className="text-ink-muted text-xs font-medium">Duración</p>
        <p className="text-ink mt-1 text-4xl font-semibold tabular-nums">
          {formatStopwatch(workout.duration_seconds ?? 0)}
        </p>
        <p className="text-ink-secondary mt-1 text-sm">
          {formatDuration(workout.duration_seconds)}
        </p>
      </Card>

      <Card>
        <dl>
          <DetailRow label="Tipo" value={workoutTypeLabel(workout.type)} />
          {workout.gym_type ? (
            <DetailRow label="Subtipo" value={gymTypeLabel(workout.gym_type)} />
          ) : null}
          <DetailRow
            label="Fecha"
            value={formatCivilDate(toCivilDate(startedAt, timeZone))}
          />
          <DetailRow
            label="Inicio"
            value={formatTimeOfDay(startedAt, timeZone)}
          />
          <DetailRow label="Fin" value={formatTimeOfDay(finishedAt, timeZone)} />
        </dl>
      </Card>

      <Card>
        <h2 className="text-ink text-sm font-semibold">Notas</h2>
        {workout.notes ? (
          <p className="text-ink-secondary mt-2 text-sm whitespace-pre-wrap">
            {workout.notes}
          </p>
        ) : (
          <p className="text-ink-muted mt-2 text-sm">
            No añadiste notas a este entrenamiento.
          </p>
        )}
      </Card>

      <DeleteWorkoutButton workoutId={workout.id} />
    </div>
  );
}
