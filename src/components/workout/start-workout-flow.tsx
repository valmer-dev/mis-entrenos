"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { GYM_TYPES, WORKOUT_TYPES } from "@/lib/domain/workout";
import { startWorkout } from "@/lib/workouts/actions";
import { INITIAL_WORKOUT_ACTION_STATE } from "@/lib/workouts/state";

type Step = "idle" | "choose-type" | "choose-gym-type";

/**
 * Flujo para empezar un entrenamiento: botón grande → actividad → (si es gym)
 * grupo muscular → el cronómetro arranca solo.
 *
 * Elegir una actividad sin subtipo envía el formulario directamente, así que
 * empezar a correr son dos toques.
 */
export function StartWorkoutFlow() {
  const [step, setStep] = useState<Step>("idle");
  const [state, formAction, isPending] = useActionState(
    startWorkout,
    INITIAL_WORKOUT_ACTION_STATE,
  );

  return (
    <div className="space-y-6">
      {step === "idle" ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <p className="text-ink-secondary text-center text-sm text-balance">
            Elige una actividad y el cronómetro empezará automáticamente.
          </p>
          <Button size="hero" onClick={() => setStep("choose-type")}>
            COMENZAR ENTRENAMIENTO
          </Button>
        </div>
      ) : null}

      {step !== "idle" ? (
        <form action={formAction} className="space-y-6">
          <fieldset disabled={isPending} className="space-y-6">
            {step === "choose-type" ? (
              <div>
                <h2 className="text-ink mb-4 text-lg font-semibold">
                  ¿Qué vas a hacer?
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  {WORKOUT_TYPES.map((definition) =>
                    definition.requiresGymType ? (
                      <button
                        key={definition.value}
                        type="button"
                        onClick={() => setStep("choose-gym-type")}
                        className="bg-surface border-border hover:border-accent hover:bg-surface-raised flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border transition-colors"
                      >
                        <span aria-hidden className="text-3xl">
                          {definition.icon}
                        </span>
                        <span className="text-ink text-sm font-semibold">
                          {definition.label}
                        </span>
                      </button>
                    ) : (
                      <button
                        key={definition.value}
                        type="submit"
                        name="type"
                        value={definition.value}
                        className="bg-surface border-border hover:border-accent hover:bg-surface-raised flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border transition-colors"
                      >
                        <span aria-hidden className="text-3xl">
                          {definition.icon}
                        </span>
                        <span className="text-ink text-sm font-semibold">
                          {definition.label}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>
            ) : null}

            {step === "choose-gym-type" ? (
              <div>
                <h2 className="text-ink mb-1 text-lg font-semibold">
                  ¿Qué entrenamiento vas a realizar?
                </h2>
                <p className="text-ink-secondary mb-4 flex items-center gap-1.5 text-sm">
                  <span aria-hidden>🏋️</span> Gym
                </p>

                {/* El tipo ya está decidido; sólo falta el grupo muscular. */}
                <input type="hidden" name="type" value="gym" />

                <div className="grid grid-cols-2 gap-3">
                  {GYM_TYPES.map((definition) => (
                    <button
                      key={definition.value}
                      type="submit"
                      name="gymType"
                      value={definition.value}
                      className="bg-surface border-border hover:border-accent hover:bg-surface-raised flex h-16 items-center justify-center rounded-2xl border px-3 text-sm font-semibold transition-colors"
                    >
                      {definition.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {state.status === "error" && state.message ? (
              <p
                role="alert"
                className="border-danger/35 bg-danger/10 text-danger rounded-xl border px-4 py-3 text-sm"
              >
                {state.message}
              </p>
            ) : null}

            {isPending ? (
              <p
                role="status"
                className="text-ink-secondary text-center text-sm"
              >
                Iniciando entrenamiento…
              </p>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="md"
                className="w-full"
                onClick={() =>
                  setStep(step === "choose-gym-type" ? "choose-type" : "idle")
                }
              >
                Atrás
              </Button>
            )}
          </fieldset>
        </form>
      ) : null}
    </div>
  );
}
