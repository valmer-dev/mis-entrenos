import type { Enums, Tables } from "@/types/database";

/**
 * Catálogo de actividades y subtipos.
 *
 * Éste es el único sitio donde se declaran los tipos de entrenamiento y sus
 * etiquetas. Añadir una actividad nueva en el futuro (p. ej. natación) son dos
 * pasos: `alter type public.workout_type add value 'swimming'` en Supabase y
 * una entrada más en `WORKOUT_TYPES`. Ninguna pantalla necesita cambios.
 */

export type WorkoutType = Enums<"workout_type">;
export type GymType = Enums<"gym_type">;

export type Workout = Tables<"workouts">;

/** Un entrenamiento en curso: por definición no tiene fecha de fin. */
export type ActiveWorkout = Omit<Workout, "finished_at" | "duration_seconds"> & {
  finished_at: null;
  duration_seconds: null;
};

/** Un entrenamiento terminado: siempre tiene fin y duración. */
export type FinishedWorkout = Omit<
  Workout,
  "finished_at" | "duration_seconds"
> & {
  finished_at: string;
  duration_seconds: number;
};

export function isActiveWorkout(workout: Workout): workout is ActiveWorkout {
  return workout.finished_at === null;
}

export function isFinishedWorkout(
  workout: Workout,
): workout is FinishedWorkout {
  return workout.finished_at !== null && workout.duration_seconds !== null;
}

type WorkoutTypeDefinition = {
  value: WorkoutType;
  label: string;
  icon: string;
  /** Si es true, hay que elegir un subtipo antes de arrancar el cronómetro. */
  requiresGymType: boolean;
};

/** Orden fijo: se respeta en todas las pantallas para que nada baile. */
export const WORKOUT_TYPES: readonly WorkoutTypeDefinition[] = [
  { value: "gym", label: "Gym", icon: "🏋️", requiresGymType: true },
  { value: "bike", label: "Bici", icon: "🚴", requiresGymType: false },
  { value: "walking", label: "Andar", icon: "🚶", requiresGymType: false },
  { value: "running", label: "Correr", icon: "🏃", requiresGymType: false },
] as const;

type GymTypeDefinition = {
  value: GymType;
  label: string;
};

export const GYM_TYPES: readonly GymTypeDefinition[] = [
  { value: "espalda", label: "Espalda" },
  { value: "pecho", label: "Pecho" },
  { value: "hombros", label: "Hombros" },
  { value: "piernas", label: "Piernas" },
  { value: "brazos", label: "Brazos" },
  { value: "full_body", label: "Full Body" },
  { value: "torso", label: "Torso" },
  { value: "otro", label: "Otro" },
] as const;

const WORKOUT_TYPE_BY_VALUE = new Map(
  WORKOUT_TYPES.map((definition) => [definition.value, definition]),
);

const GYM_TYPE_BY_VALUE = new Map(
  GYM_TYPES.map((definition) => [definition.value, definition]),
);

export function isWorkoutType(value: unknown): value is WorkoutType {
  return typeof value === "string" && WORKOUT_TYPE_BY_VALUE.has(value as WorkoutType);
}

export function isGymType(value: unknown): value is GymType {
  return typeof value === "string" && GYM_TYPE_BY_VALUE.has(value as GymType);
}

export function workoutTypeLabel(type: WorkoutType): string {
  return WORKOUT_TYPE_BY_VALUE.get(type)?.label ?? type;
}

export function workoutTypeIcon(type: WorkoutType): string {
  return WORKOUT_TYPE_BY_VALUE.get(type)?.icon ?? "🏅";
}

export function gymTypeLabel(gymType: GymType): string {
  return GYM_TYPE_BY_VALUE.get(gymType)?.label ?? gymType;
}

/**
 * Título de un entrenamiento tal y como se muestra en listas y tarjetas:
 * para gym manda el grupo muscular ("Espalda"), para el resto la actividad.
 */
export function workoutTitle(workout: {
  type: WorkoutType;
  gym_type: GymType | null;
}): string {
  if (workout.type === "gym" && workout.gym_type) {
    return gymTypeLabel(workout.gym_type);
  }
  return workoutTypeLabel(workout.type);
}

/** Subtítulo opcional: sólo aporta información en los entrenamientos de gym. */
export function workoutSubtitle(workout: {
  type: WorkoutType;
  gym_type: GymType | null;
}): string | null {
  return workout.type === "gym" && workout.gym_type
    ? workoutTypeLabel(workout.type)
    : null;
}
