import "server-only";

import { cookies } from "next/headers";

import {
  addCivilDays,
  civilToInstant,
  toCivilDate,
} from "@/lib/date/civil";
import type { GymType, Workout, WorkoutType } from "@/lib/domain/workout";
import { hasSupabaseEnv } from "@/lib/supabase/env";

/**
 * Modo demostración: la aplicación funciona sin base de datos.
 *
 * Sirve para poder ver y probar la interfaz antes de configurar Supabase. Se
 * activa SOLO cuando faltan las variables de entorno, así que en cuanto se
 * configura el proyecto desaparece sin tener que acordarse de apagar nada. No
 * existe ninguna forma de activarlo con Supabase configurado: es imposible que
 * se cuelen datos de ejemplo en una instalación real.
 *
 * Los entrenamientos de ejemplo se generan al vuelo a partir de la fecha de hoy
 * (nunca se guardan), y lo que crea el usuario durante la demo vive en una
 * cookie. Eso basta para que el cronómetro sobreviva a recargas, que es lo que
 * hay que poder probar.
 */

export function isDemoMode(): boolean {
  return !hasSupabaseEnv();
}

const DEMO_COOKIE = "demo_state";
const DEMO_USER_ID = "00000000-0000-0000-0000-0000000000de";
/** Tope defensivo: una cookie no debe pasar de ~4 KB. */
const MAX_STORED_WORKOUTS = 25;

type StoredActive = {
  id: string;
  type: WorkoutType;
  gymType: GymType | null;
  startedAt: string;
};

type StoredFinished = StoredActive & {
  finishedAt: string;
  notes: string | null;
};

type DemoState = {
  /** Entrenamiento en curso, si lo hay. */
  active: StoredActive | null;
  /** Entrenamientos creados durante la demo. */
  created: StoredFinished[];
  /** Ids de entrenamientos de ejemplo que el usuario ha borrado. */
  removed: string[];
};

const EMPTY_STATE: DemoState = { active: null, created: [], removed: [] };

// ---------------------------------------------------------------------------
// Entrenamientos de ejemplo
// ---------------------------------------------------------------------------

type SeedEntry = {
  daysAgo: number;
  hour: number;
  minute: number;
  type: WorkoutType;
  gymType: GymType | null;
  minutes: number;
};

/**
 * Historial de ejemplo. Está pensado para que el dashboard cuente algo:
 * varias actividades, gym repartido entre grupos musculares, alguna sesión
 * larga que destaque como récord y densidad suficiente en la semana en curso.
 */
const SEED: readonly SeedEntry[] = [
  // Los días recientes van densos a propósito: la vista por defecto es "esta
  // semana", y a principio de semana quedaría casi vacía con menos sesiones.
  { daysAgo: 0, hour: 19, minute: 32, type: "gym", gymType: "espalda", minutes: 72 },
  { daysAgo: 0, hour: 8, minute: 40, type: "walking", gymType: null, minutes: 32 },
  { daysAgo: 1, hour: 8, minute: 15, type: "running", gymType: null, minutes: 35 },
  { daysAgo: 2, hour: 18, minute: 40, type: "gym", gymType: "pecho", minutes: 65 },
  { daysAgo: 3, hour: 17, minute: 5, type: "bike", gymType: null, minutes: 52 },
  { daysAgo: 4, hour: 19, minute: 10, type: "gym", gymType: "piernas", minutes: 125 },
  { daysAgo: 5, hour: 18, minute: 25, type: "gym", gymType: "brazos", minutes: 54 },
  { daysAgo: 6, hour: 10, minute: 30, type: "walking", gymType: null, minutes: 48 },
  { daysAgo: 7, hour: 19, minute: 0, type: "gym", gymType: "hombros", minutes: 58 },
  { daysAgo: 8, hour: 7, minute: 45, type: "running", gymType: null, minutes: 42 },
  { daysAgo: 10, hour: 18, minute: 20, type: "gym", gymType: "brazos", minutes: 55 },
  { daysAgo: 11, hour: 17, minute: 30, type: "bike", gymType: null, minutes: 68 },
  { daysAgo: 13, hour: 19, minute: 15, type: "gym", gymType: "espalda", minutes: 70 },
  { daysAgo: 15, hour: 9, minute: 0, type: "walking", gymType: null, minutes: 40 },
  { daysAgo: 17, hour: 18, minute: 50, type: "gym", gymType: "full_body", minutes: 80 },
  { daysAgo: 20, hour: 19, minute: 5, type: "gym", gymType: "piernas", minutes: 95 },
  { daysAgo: 24, hour: 8, minute: 30, type: "running", gymType: null, minutes: 38 },
  { daysAgo: 28, hour: 18, minute: 0, type: "gym", gymType: "torso", minutes: 62 },
  { daysAgo: 33, hour: 17, minute: 20, type: "bike", gymType: null, minutes: 75 },
  { daysAgo: 41, hour: 19, minute: 30, type: "gym", gymType: "pecho", minutes: 60 },
] as const;

function buildWorkout(params: {
  id: string;
  type: WorkoutType;
  gymType: GymType | null;
  startedAt: Date;
  finishedAt: Date | null;
  notes?: string | null;
}): Workout {
  const { id, type, gymType, startedAt, finishedAt, notes = null } = params;

  const durationSeconds = finishedAt
    ? Math.max(
        0,
        Math.floor((finishedAt.getTime() - startedAt.getTime()) / 1000),
      )
    : null;

  return {
    id,
    user_id: DEMO_USER_ID,
    type,
    gym_type: gymType,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt ? finishedAt.toISOString() : null,
    duration_seconds: durationSeconds,
    notes,
    created_at: startedAt.toISOString(),
    updated_at: (finishedAt ?? startedAt).toISOString(),
  };
}

/**
 * Los entrenamientos de ejemplo se anclan al calendario local del usuario, de
 * modo que "hace 2 días" cae siempre en el día correcto del dashboard.
 */
function buildSeedWorkouts(now: Date, timeZone: string): Workout[] {
  const today = toCivilDate(now, timeZone);

  return SEED.map((entry, index) => {
    const day = addCivilDays(today, -entry.daysAgo);
    const startedAt = civilToInstant(
      { ...day, hour: entry.hour, minute: entry.minute, second: 0 },
      timeZone,
    );
    const finishedAt = new Date(startedAt.getTime() + entry.minutes * 60_000);

    return buildWorkout({
      id: `demo-${String(index).padStart(2, "0")}`,
      type: entry.type,
      gymType: entry.gymType,
      startedAt,
      // Un ejemplo nunca puede quedar en el futuro (el de hoy podría, si se
      // abre la aplicación por la mañana).
      finishedAt: finishedAt > now ? now : finishedAt,
    });
  }).filter((workout) => new Date(workout.started_at) <= now);
}

// ---------------------------------------------------------------------------
// Estado guardado en la cookie
// ---------------------------------------------------------------------------

async function readState(): Promise<DemoState> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DEMO_COOKIE)?.value;
  if (!raw) return EMPTY_STATE;

  try {
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    return {
      active: parsed.active ?? null,
      created: Array.isArray(parsed.created) ? parsed.created : [],
      removed: Array.isArray(parsed.removed) ? parsed.removed : [],
    };
  } catch {
    // Cookie corrupta o de una versión anterior: se empieza de cero.
    return EMPTY_STATE;
  }
}

async function writeState(state: DemoState): Promise<void> {
  const cookieStore = await cookies();

  const trimmed: DemoState = {
    active: state.active,
    created: state.created.slice(-MAX_STORED_WORKOUTS),
    removed: state.removed.slice(-MAX_STORED_WORKOUTS),
  };

  cookieStore.set(DEMO_COOKIE, JSON.stringify(trimmed), {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    httpOnly: true,
  });
}

// ---------------------------------------------------------------------------
// API equivalente a la de Supabase
// ---------------------------------------------------------------------------

export async function getDemoActiveWorkout(): Promise<Workout | null> {
  const { active } = await readState();
  if (!active) return null;

  return buildWorkout({
    id: active.id,
    type: active.type,
    gymType: active.gymType,
    startedAt: new Date(active.startedAt),
    finishedAt: null,
  });
}

/** Todos los entrenamientos terminados, del más reciente al más antiguo. */
export async function listDemoWorkouts(
  now: Date,
  timeZone: string,
): Promise<Workout[]> {
  const state = await readState();
  const removed = new Set(state.removed);

  const created = state.created.map((entry) =>
    buildWorkout({
      id: entry.id,
      type: entry.type,
      gymType: entry.gymType,
      startedAt: new Date(entry.startedAt),
      finishedAt: new Date(entry.finishedAt),
      notes: entry.notes,
    }),
  );

  return [...buildSeedWorkouts(now, timeZone), ...created]
    .filter((workout) => !removed.has(workout.id))
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
}

export async function getDemoWorkoutById(
  id: string,
  now: Date,
  timeZone: string,
): Promise<Workout | null> {
  const active = await getDemoActiveWorkout();
  if (active?.id === id) return active;

  const workouts = await listDemoWorkouts(now, timeZone);
  return workouts.find((workout) => workout.id === id) ?? null;
}

export type DemoStartResult = { ok: true } | { ok: false; reason: "active" };

export async function startDemoWorkout(
  type: WorkoutType,
  gymType: GymType | null,
): Promise<DemoStartResult> {
  const state = await readState();
  // Misma garantía que el índice único de Postgres: un solo entreno activo.
  if (state.active) return { ok: false, reason: "active" };

  await writeState({
    ...state,
    active: {
      id: `demo-live-${Date.now().toString(36)}`,
      type,
      gymType,
      startedAt: new Date().toISOString(),
    },
  });

  return { ok: true };
}

/** Devuelve el id del entrenamiento guardado, o null si no había ninguno activo. */
export async function finishDemoWorkout(
  notes: string | null,
): Promise<string | null> {
  const state = await readState();
  if (!state.active) return null;

  const finished: StoredFinished = {
    ...state.active,
    finishedAt: new Date().toISOString(),
    notes,
  };

  await writeState({
    ...state,
    active: null,
    created: [...state.created, finished],
  });

  return finished.id;
}

export async function discardDemoWorkout(): Promise<void> {
  const state = await readState();
  await writeState({ ...state, active: null });
}

export async function deleteDemoWorkout(id: string): Promise<void> {
  const state = await readState();

  await writeState({
    ...state,
    created: state.created.filter((entry) => entry.id !== id),
    removed: [...state.removed, id],
  });
}
