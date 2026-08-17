import {
  type CivilDate,
  addCivilDays,
  addCivilMonths,
  startOfCivilDay,
  startOfCivilMonth,
  startOfCivilWeek,
  startOfCivilYear,
  toCivilDate,
} from "@/lib/date/civil";

/**
 * Periodos de análisis del dashboard.
 *
 * Un periodo define dos cosas:
 *  1. el rango de instantes por el que se filtra la consulta a Supabase, y
 *  2. cómo se agrupan las barras de la gráfica de actividad (día, semana o mes).
 *
 * Así, el mismo componente de gráfica sirve para "esta semana" (7 barras de
 * días) y para "este año" (12 barras de meses) sin lógica duplicada.
 */

export const PERIOD_IDS = ["week", "month", "last30", "year", "all"] as const;

export type PeriodId = (typeof PERIOD_IDS)[number];

export const DEFAULT_PERIOD: PeriodId = "week";

export type BucketGranularity = "day" | "week" | "month";

type PeriodDefinition = {
  id: PeriodId;
  label: string;
  /** Título de la gráfica de actividad para este periodo. */
  chartTitle: string;
  granularity: BucketGranularity;
};

const PERIOD_DEFINITIONS: readonly PeriodDefinition[] = [
  {
    id: "week",
    label: "Esta semana",
    chartTitle: "Actividad de la semana",
    granularity: "day",
  },
  {
    id: "month",
    label: "Este mes",
    chartTitle: "Actividad del mes",
    granularity: "week",
  },
  {
    id: "last30",
    label: "Últimos 30 días",
    chartTitle: "Actividad de los últimos 30 días",
    granularity: "week",
  },
  {
    id: "year",
    label: "Este año",
    chartTitle: "Actividad del año",
    granularity: "month",
  },
  {
    id: "all",
    label: "Todo",
    chartTitle: "Actividad de los últimos 12 meses",
    granularity: "month",
  },
] as const;

export const PERIODS = PERIOD_DEFINITIONS;

const PERIOD_BY_ID = new Map(
  PERIOD_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export function isPeriodId(value: unknown): value is PeriodId {
  return typeof value === "string" && PERIOD_BY_ID.has(value as PeriodId);
}

export function parsePeriodId(value: unknown): PeriodId {
  return isPeriodId(value) ? value : DEFAULT_PERIOD;
}

export function periodLabel(id: PeriodId): string {
  return PERIOD_BY_ID.get(id)?.label ?? id;
}

export function periodChartTitle(id: PeriodId): string {
  return PERIOD_BY_ID.get(id)?.chartTitle ?? "Actividad";
}

export function periodGranularity(id: PeriodId): BucketGranularity {
  return PERIOD_BY_ID.get(id)?.granularity ?? "day";
}

export type PeriodRange = {
  id: PeriodId;
  /** Primera fecha incluida. `null` en "Todo" (sin límite inferior). */
  fromCivil: CivilDate | null;
  /** Primera fecha NO incluida. */
  toCivilExclusive: CivilDate;
  /** Instante desde el que consultar, inclusivo. `null` = sin límite. */
  from: Date | null;
  /** Instante hasta el que consultar, exclusivo. */
  to: Date;
};

/**
 * Traduce un periodo a un rango concreto de instantes, en la zona horaria del
 * usuario. `now` se recibe como parámetro para que la función sea pura.
 */
export function resolvePeriodRange(
  id: PeriodId,
  now: Date,
  timeZone: string,
): PeriodRange {
  const today = toCivilDate(now, timeZone);
  const tomorrow = addCivilDays(today, 1);

  let fromCivil: CivilDate | null;
  let toCivilExclusive: CivilDate;

  switch (id) {
    case "week": {
      const monday = startOfCivilWeek(today);
      fromCivil = monday;
      toCivilExclusive = addCivilDays(monday, 7);
      break;
    }
    case "month": {
      const first = startOfCivilMonth(today);
      fromCivil = first;
      toCivilExclusive = addCivilMonths(first, 1);
      break;
    }
    case "last30": {
      fromCivil = addCivilDays(today, -29);
      toCivilExclusive = tomorrow;
      break;
    }
    case "year": {
      const first = startOfCivilYear(today);
      fromCivil = first;
      toCivilExclusive = addCivilMonths(first, 12);
      break;
    }
    case "all": {
      fromCivil = null;
      toCivilExclusive = tomorrow;
      break;
    }
  }

  return {
    id,
    fromCivil,
    toCivilExclusive,
    from: fromCivil ? startOfCivilDay(fromCivil, timeZone) : null,
    to: startOfCivilDay(toCivilExclusive, timeZone),
  };
}

/** Rango de la semana actual (lunes → lunes siguiente). */
export function resolveCurrentWeekRange(
  now: Date,
  timeZone: string,
): { from: Date; to: Date } {
  const range = resolvePeriodRange("week", now, timeZone);
  return { from: range.from as Date, to: range.to };
}
