"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatStopwatch } from "@/lib/date/format";
import type { Workout } from "@/lib/domain/workout";
import {
  workoutSubtitle,
  workoutTitle,
  workoutTypeIcon,
} from "@/lib/domain/workout";
import { useElapsedSeconds } from "@/lib/hooks/use-elapsed-seconds";
import { discardWorkout, finishWorkout } from "@/lib/workouts/actions";
import { INITIAL_WORKOUT_ACTION_STATE } from "@/lib/workouts/state";

type ActiveWorkoutScreenProps = {
  workout: Workout;
  /** Hora de inicio ya formateada en el servidor, con la zona del usuario. */
  startedAtLabel: string;
};

/**
 * Pantalla del entrenamiento en curso.
 *
 * El cronómetro se calcula siempre desde `started_at`, así que da igual que se
 * bloquee la pantalla, se cambie de pestaña o se recargue: al volver, el tiempo
 * es el correcto.
 */
export function ActiveWorkoutScreen({
  workout,
  startedAtLabel,
}: ActiveWorkoutScreenProps) {
  const elapsed = useElapsedSeconds(workout.started_at);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const [state, formAction, isPending] = useActionState(
    finishWorkout,
    INITIAL_WORKOUT_ACTION_STATE,
  );

  const subtitle = workoutSubtitle(workout);

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center pt-6 text-center">
        <span aria-hidden className="text-5xl">
          {workoutTypeIcon(workout.type)}
        </span>

        {subtitle ? (
          <p className="text-ink-muted mt-4 text-xs font-semibold tracking-[0.2em] uppercase">
            {subtitle}
          </p>
        ) : null}

        <h1 className="text-ink mt-1 text-2xl font-semibold tracking-tight">
          {workoutTitle(workout)}
        </h1>

        <p className="text-ink-secondary mt-1 text-sm">
          Empezado a las {startedAtLabel}
        </p>
      </div>

      {/*
        `tabular-nums` sí está justificado aquí: sin ancho fijo por dígito, el
        cronómetro daría saltos horizontales cada segundo.
        `suppressHydrationWarning` porque el valor del servidor y el del
        navegador se calculan con milisegundos distintos.
      */}
      <p
        suppressHydrationWarning
        aria-live="off"
        className="text-ink my-10 text-6xl font-semibold tabular-nums sm:text-7xl"
      >
        {formatStopwatch(elapsed)}
      </p>

      <div className="w-full max-w-sm space-y-3">
        <Button
          size="hero"
          variant="primary"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
        >
          FINALIZAR ENTRENAMIENTO
        </Button>

        <Button
          variant="ghost"
          size="md"
          className="w-full"
          onClick={() => setDiscardOpen(true)}
          disabled={isPending}
        >
          Descartar entrenamiento
        </Button>
      </div>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="border-danger/35 bg-danger/10 text-danger mt-4 w-full max-w-sm rounded-xl border px-4 py-3 text-sm"
        >
          {state.message}
        </p>
      ) : null}

      <Modal
        open={confirmOpen}
        title="¿Quieres finalizar este entrenamiento?"
        description={`Se guardará con una duración de ${formatStopwatch(elapsed)}.`}
        onClose={() => setConfirmOpen(false)}
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={workout.id} />

          <TextAreaField
            id="notes"
            name="notes"
            label="Notas (opcional)"
            rows={3}
            maxLength={2000}
            placeholder="¿Cómo ha ido?"
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" size="lg" className="flex-1" disabled={isPending}>
              {isPending ? "Guardando…" : "Finalizar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={discardOpen}
        title="¿Descartar este entrenamiento?"
        description="No se guardará y no aparecerá en tu histórico. Esta acción no se puede deshacer."
        onClose={() => setDiscardOpen(false)}
      >
        <form action={discardWorkout} className="flex gap-3">
          <input type="hidden" name="id" value={workout.id} />
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => setDiscardOpen(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="danger" size="lg" className="flex-1">
            Descartar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
