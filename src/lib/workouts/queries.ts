import "server-only";

import { getUserTimeZone } from "@/lib/date/timezone";
import {
  type PeriodId,
  resolveCurrentWeekRange,
  resolvePeriodRange,
} from "@/lib/domain/periods";
import type { Workout, WorkoutType } from "@/lib/domain/workout";
import { computeDashboardStats, type DashboardStats } from "@/lib/stats/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Acceso de lectura a los entrenamientos.
 *
 * Todo ocurre en el servidor. Las consultas filtran por `user_id` de forma
 * explícita — no porque haga falta para la seguridad (de eso se encarga RLS en
 * Postgres), sino porque así el planificador usa el índice
 * `workouts_user_started_at_idx` directamente.
 */

/** Columnas que necesitan las listas y tarjetas. */
const LIST_COLUMNS =
  "id, type, gym_type, started_at, finished_at, duration_seconds" as const;

/** Columnas mínimas para agregar estadísticas. */
const STATS_COLUMNS =
  "id, type, gym_type, started_at, duration_seconds" as const;

export type WorkoutListItem = Pick<
  Workout,
  "id" | "type" | "gym_type" | "started_at" | "finished_at" | "duration_seconds"
>;

async function requireUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // El middleware ya redirige antes de llegar aquí; esto cubre el caso de que
    // la sesión caduque justo entre la comprobación y la consulta.
    throw new Error("No hay sesión activa.");
  }

  return user.id;
}

/**
 * El entrenamiento en curso, si lo hay.
 *
 * Es la única fuente de verdad del cronómetro: el estado no vive en el
 * navegador, así que sobrevive a recargas, a cerrar la pestaña y a cambiar de
 * dispositivo. Un índice único parcial garantiza que no puede haber dos.
 */
export async function getActiveWorkout(): Promise<Workout | null> {
  const supabase = await createSupabaseServerClient();
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .is("finished_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getWorkoutById(id: string): Promise<Workout | null> {
  const supabase = await createSupabaseServerClient();
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  // Un id con formato inválido hace que Postgres devuelva error en lugar de
  // "no encontrado"; para la interfaz es lo mismo.
  if (error) return null;
  return data;
}

export type DashboardData = {
  periodId: PeriodId;
  timeZone: string;
  stats: DashboardStats;
  /** Últimos entrenamientos, independientes del periodo seleccionado. */
  recentWorkouts: WorkoutListItem[];
  lastWorkout: WorkoutListItem | null;
  /** Entrenamientos de la semana en curso (lunes a domingo). */
  workoutsThisWeek: number;
  /** False sólo para un usuario que todavía no ha entrenado nunca. */
  hasAnyWorkout: boolean;
};

const RECENT_WORKOUTS_LIMIT = 5;

/**
 * Todos los datos del dashboard, calculados a partir de los entrenamientos
 * reales guardados en Supabase. No hay ningún valor fijo.
 */
export async function getDashboardData(
  periodId: PeriodId,
): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();
  const userId = await requireUserId();
  const timeZone = await getUserTimeZone();
  const now = new Date();

  const range = resolvePeriodRange(periodId, now, timeZone);
  const week = resolveCurrentWeekRange(now, timeZone);

  // Sólo cuentan los entrenamientos terminados: el que está en curso todavía no
  // tiene duración y falsearía las medias.
  let periodQuery = supabase
    .from("workouts")
    .select(STATS_COLUMNS)
    .eq("user_id", userId)
    .not("finished_at", "is", null)
    .lt("started_at", range.to.toISOString());

  if (range.from) {
    periodQuery = periodQuery.gte("started_at", range.from.toISOString());
  }

  const recentQuery = supabase
    .from("workouts")
    .select(LIST_COLUMNS)
    .eq("user_id", userId)
    .not("finished_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(RECENT_WORKOUTS_LIMIT);

  const weekCountQuery = supabase
    .from("workouts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("finished_at", "is", null)
    .gte("started_at", week.from.toISOString())
    .lt("started_at", week.to.toISOString());

  const [periodResult, recentResult, weekResult] = await Promise.all([
    periodQuery,
    recentQuery,
    weekCountQuery,
  ]);

  if (periodResult.error) throw new Error(periodResult.error.message);
  if (recentResult.error) throw new Error(recentResult.error.message);
  if (weekResult.error) throw new Error(weekResult.error.message);

  const recentWorkouts = recentResult.data ?? [];

  return {
    periodId,
    timeZone,
    stats: computeDashboardStats(periodResult.data ?? [], range, now, timeZone),
    recentWorkouts,
    lastWorkout: recentWorkouts[0] ?? null,
    workoutsThisWeek: weekResult.count ?? 0,
    // `recentWorkouts` ignora el periodo, así que basta para saber si el
    // usuario ha entrenado alguna vez.
    hasAnyWorkout: recentWorkouts.length > 0,
  };
}

export type HistoryFilters = {
  type: WorkoutType | "all";
  range: "all" | "week" | "month" | "last30";
};

export type HistoryData = {
  workouts: WorkoutListItem[];
  timeZone: string;
  /** True si el usuario tiene entrenamientos aunque el filtro no devuelva nada. */
  hasAnyWorkout: boolean;
};

const HISTORY_LIMIT = 500;

export async function getHistory(filters: HistoryFilters): Promise<HistoryData> {
  const supabase = await createSupabaseServerClient();
  const userId = await requireUserId();
  const timeZone = await getUserTimeZone();
  const now = new Date();

  let query = supabase
    .from("workouts")
    .select(LIST_COLUMNS)
    .eq("user_id", userId)
    .not("finished_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters.range !== "all") {
    const range = resolvePeriodRange(filters.range, now, timeZone);
    if (range.from) {
      query = query.gte("started_at", range.from.toISOString());
    }
    query = query.lt("started_at", range.to.toISOString());
  }

  const isFiltered = filters.type !== "all" || filters.range !== "all";

  const [listResult, anyResult] = await Promise.all([
    query,
    isFiltered
      ? supabase
          .from("workouts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .not("finished_at", "is", null)
      : Promise.resolve({ count: null, error: null }),
  ]);

  if (listResult.error) throw new Error(listResult.error.message);

  const workouts = listResult.data ?? [];

  return {
    workouts,
    timeZone,
    hasAnyWorkout: isFiltered
      ? (anyResult.count ?? 0) > 0
      : workouts.length > 0,
  };
}

export type ProfileSummary = {
  email: string;
  displayName: string | null;
  memberSince: string;
  totalWorkouts: number;
  totalSeconds: number;
};

export async function getProfileSummary(): Promise<ProfileSummary> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No hay sesión activa.");

  const [profileResult, workoutsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("workouts")
      .select("duration_seconds")
      .eq("user_id", user.id)
      .not("finished_at", "is", null),
  ]);

  const workouts = workoutsResult.data ?? [];

  return {
    email: user.email ?? "",
    displayName: profileResult.data?.display_name ?? null,
    memberSince: user.created_at,
    totalWorkouts: workouts.length,
    totalSeconds: workouts.reduce(
      (total, workout) => total + (workout.duration_seconds ?? 0),
      0,
    ),
  };
}

