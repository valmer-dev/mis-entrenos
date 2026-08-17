import {
  type CivilDate,
  addCivilDays,
  addCivilMonths,
  civilDateKey,
  civilDaysBetween,
  civilWeekday,
  startOfCivilMonth,
  startOfCivilWeek,
  toCivilDate,
} from "@/lib/date/civil";
import {
  formatCivilDateShort,
  monthShortLabel,
  weekdayLongLabel,
  weekdayShortLabel,
} from "@/lib/date/format";
import {
  type BucketGranularity,
  type PeriodRange,
  periodGranularity,
} from "@/lib/domain/periods";
import type { GymType, WorkoutType } from "@/lib/domain/workout";
import { WORKOUT_TYPES } from "@/lib/domain/workout";

/**
 * Cálculo de las estadísticas del dashboard.
 *
 * Todo lo de este módulo son funciones puras: reciben los entrenamientos ya
 * traídos de Supabase y devuelven los números que pinta la interfaz. No hay
 * ningún valor fijo ni dato de ejemplo — si no hay entrenamientos, todas las
 * cifras salen a cero. Al ser puras se pueden testear sin base de datos
 * (ver `dashboard.test.ts`).
 */

/** Columnas mínimas que necesitan los cálculos. */
export type WorkoutForStats = {
  id: string;
  type: WorkoutType;
  gym_type: GymType | null;
  started_at: string;
  duration_seconds: number | null;
};

export type TypeBreakdownEntry = {
  type: WorkoutType;
  count: number;
  totalSeconds: number;
};

export type GymBreakdownEntry = {
  gymType: GymType;
  count: number;
  totalSeconds: number;
};

export type ActivityBucket = {
  key: string;
  /** Etiqueta corta bajo la barra ("Lun", "S1", "Ago"). */
  label: string;
  /** Descripción completa para lectores de pantalla y tooltip. */
  fullLabel: string;
  count: number;
  totalSeconds: number;
  /** True para el día/semana/mes en curso: la gráfica lo destaca. */
  isCurrent: boolean;
};

export type ActivityChart = {
  granularity: BucketGranularity;
  buckets: ActivityBucket[];
  maxCount: number;
};

export type DashboardStats = {
  /** Entrenamientos terminados dentro del periodo seleccionado. */
  totalWorkouts: number;
  totalSeconds: number;
  /** Media de duración por entrenamiento, en segundos. */
  averageSeconds: number;
  typeBreakdown: TypeBreakdownEntry[];
  gymBreakdown: GymBreakdownEntry[];
  longestWorkout: WorkoutForStats | null;
  activity: ActivityChart;
};

function durationOf(workout: WorkoutForStats): number {
  return workout.duration_seconds ?? 0;
}

// ---------------------------------------------------------------------------
// Barras de la gráfica de actividad
// ---------------------------------------------------------------------------

type BucketDefinition = {
  key: string;
  label: string;
  fullLabel: string;
  start: CivilDate;
  endExclusive: CivilDate;
};

function buildDayBuckets(
  from: CivilDate,
  toExclusive: CivilDate,
  today: CivilDate,
): BucketDefinition[] {
  const buckets: BucketDefinition[] = [];
  const totalDays = civilDaysBetween(from, toExclusive);

  for (let offset = 0; offset < totalDays; offset += 1) {
    const day = addCivilDays(from, offset);
    buckets.push({
      key: civilDateKey(day),
      label: weekdayShortLabel(civilWeekday(day)),
      fullLabel: `${weekdayLongLabel(civilWeekday(day))} ${formatCivilDateShort(day, today.year)}`,
      start: day,
      endExclusive: addCivilDays(day, 1),
    });
  }

  return buckets;
}

function buildWeekBuckets(
  from: CivilDate,
  toExclusive: CivilDate,
  today: CivilDate,
): BucketDefinition[] {
  const buckets: BucketDefinition[] = [];
  // Las semanas se alinean a lunes, pero se recortan al periodo: la "semana 1"
  // de un mes empieza el día 1, no el lunes anterior.
  let cursor = from;
  let index = 1;

  while (civilDaysBetween(cursor, toExclusive) > 0) {
    const nextMonday = addCivilDays(startOfCivilWeek(cursor), 7);
    const end =
      civilDaysBetween(nextMonday, toExclusive) > 0 ? nextMonday : toExclusive;
    const lastDay = addCivilDays(end, -1);

    buckets.push({
      key: `w-${civilDateKey(cursor)}`,
      label: `S${index}`,
      fullLabel:
        civilDaysBetween(cursor, lastDay) === 0
          ? formatCivilDateShort(cursor, today.year)
          : `Semana ${index}: ${formatCivilDateShort(cursor, today.year)} – ${formatCivilDateShort(lastDay, today.year)}`,
      start: cursor,
      endExclusive: end,
    });

    cursor = end;
    index += 1;
  }

  return buckets;
}

function buildMonthBuckets(
  from: CivilDate,
  toExclusive: CivilDate,
): BucketDefinition[] {
  const buckets: BucketDefinition[] = [];
  let cursor = startOfCivilMonth(from);

  while (civilDaysBetween(cursor, toExclusive) > 0) {
    const next = addCivilMonths(cursor, 1);
    buckets.push({
      key: `m-${cursor.year}-${cursor.month}`,
      label: monthShortLabel(cursor.month),
      fullLabel: `${monthShortLabel(cursor.month)} ${cursor.year}`,
      start: cursor,
      endExclusive: next,
    });
    cursor = next;
  }

  return buckets;
}

/**
 * Ventana temporal que dibuja la gráfica. Coincide con el periodo salvo en
 * "Todo", donde el rango no tiene principio: ahí se muestran los últimos 12
 * meses (el título de la gráfica lo dice explícitamente).
 */
function resolveChartWindow(
  range: PeriodRange,
  today: CivilDate,
): { from: CivilDate; toExclusive: CivilDate } {
  if (range.fromCivil) {
    return { from: range.fromCivil, toExclusive: range.toCivilExclusive };
  }

  const currentMonth = startOfCivilMonth(today);
  return {
    from: addCivilMonths(currentMonth, -11),
    toExclusive: addCivilMonths(currentMonth, 1),
  };
}

function buildBucketDefinitions(
  granularity: BucketGranularity,
  window: { from: CivilDate; toExclusive: CivilDate },
  today: CivilDate,
): BucketDefinition[] {
  switch (granularity) {
    case "day":
      return buildDayBuckets(window.from, window.toExclusive, today);
    case "week":
      return buildWeekBuckets(window.from, window.toExclusive, today);
    case "month":
      return buildMonthBuckets(window.from, window.toExclusive);
  }
}

function findBucketIndex(
  buckets: BucketDefinition[],
  day: CivilDate,
): number {
  // Como máximo hay 12 barras, así que un recorrido lineal es más simple y más
  // rápido que construir un índice.
  return buckets.findIndex(
    (bucket) =>
      civilDaysBetween(bucket.start, day) >= 0 &&
      civilDaysBetween(day, bucket.endExclusive) > 0,
  );
}

function buildActivityChart(
  workouts: WorkoutForStats[],
  range: PeriodRange,
  now: Date,
  timeZone: string,
): ActivityChart {
  const today = toCivilDate(now, timeZone);
  const granularity = periodGranularity(range.id);
  const definitions = buildBucketDefinitions(
    granularity,
    resolveChartWindow(range, today),
    today,
  );

  const counts = new Array<number>(definitions.length).fill(0);
  const seconds = new Array<number>(definitions.length).fill(0);

  for (const workout of workouts) {
    const day = toCivilDate(new Date(workout.started_at), timeZone);
    const index = findBucketIndex(definitions, day);
    if (index === -1) continue;

    counts[index] += 1;
    seconds[index] += durationOf(workout);
  }

  const currentIndex = findBucketIndex(definitions, today);

  const buckets: ActivityBucket[] = definitions.map((definition, index) => ({
    key: definition.key,
    label: definition.label,
    fullLabel: definition.fullLabel,
    count: counts[index],
    totalSeconds: seconds[index],
    isCurrent: index === currentIndex,
  }));

  return {
    granularity,
    buckets,
    maxCount: buckets.reduce((max, bucket) => Math.max(max, bucket.count), 0),
  };
}

// ---------------------------------------------------------------------------
// Reparto por actividad y por grupo muscular
// ---------------------------------------------------------------------------

function buildTypeBreakdown(workouts: WorkoutForStats[]): TypeBreakdownEntry[] {
  const totals = new Map<WorkoutType, TypeBreakdownEntry>();

  for (const workout of workouts) {
    const entry = totals.get(workout.type) ?? {
      type: workout.type,
      count: 0,
      totalSeconds: 0,
    };
    entry.count += 1;
    entry.totalSeconds += durationOf(workout);
    totals.set(workout.type, entry);
  }

  // Orden: primero el que más se repite; a igualdad, el orden fijo del catálogo
  // para que la lista no baile entre recargas.
  const catalogOrder = WORKOUT_TYPES.map((definition) => definition.value);

  return [...totals.values()].sort(
    (a, b) =>
      b.count - a.count ||
      b.totalSeconds - a.totalSeconds ||
      catalogOrder.indexOf(a.type) - catalogOrder.indexOf(b.type),
  );
}

function buildGymBreakdown(workouts: WorkoutForStats[]): GymBreakdownEntry[] {
  const totals = new Map<GymType, GymBreakdownEntry>();

  for (const workout of workouts) {
    if (workout.type !== "gym" || !workout.gym_type) continue;

    const entry = totals.get(workout.gym_type) ?? {
      gymType: workout.gym_type,
      count: 0,
      totalSeconds: 0,
    };
    entry.count += 1;
    entry.totalSeconds += durationOf(workout);
    totals.set(workout.gym_type, entry);
  }

  return [...totals.values()].sort(
    (a, b) =>
      b.count - a.count ||
      b.totalSeconds - a.totalSeconds ||
      a.gymType.localeCompare(b.gymType),
  );
}

function findLongestWorkout(
  workouts: WorkoutForStats[],
): WorkoutForStats | null {
  let longest: WorkoutForStats | null = null;

  for (const workout of workouts) {
    if (durationOf(workout) <= 0) continue;
    if (!longest || durationOf(workout) > durationOf(longest)) {
      longest = workout;
    }
  }

  return longest;
}

// ---------------------------------------------------------------------------

/**
 * Punto de entrada: convierte la lista de entrenamientos del periodo en todo
 * lo que necesita el dashboard.
 */
export function computeDashboardStats(
  workouts: WorkoutForStats[],
  range: PeriodRange,
  now: Date,
  timeZone: string,
): DashboardStats {
  const totalWorkouts = workouts.length;
  const totalSeconds = workouts.reduce(
    (total, workout) => total + durationOf(workout),
    0,
  );

  return {
    totalWorkouts,
    totalSeconds,
    averageSeconds:
      totalWorkouts === 0 ? 0 : Math.round(totalSeconds / totalWorkouts),
    typeBreakdown: buildTypeBreakdown(workouts),
    gymBreakdown: buildGymBreakdown(workouts),
    longestWorkout: findLongestWorkout(workouts),
    activity: buildActivityChart(workouts, range, now, timeZone),
  };
}

