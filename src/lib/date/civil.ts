/**
 * Aritmética de fechas con zona horaria.
 *
 * Todos los entrenamientos se guardan en Supabase como `timestamptz`, es decir,
 * como instantes absolutos. Pero las preguntas del dashboard ("¿cuántos
 * entrenamientos hice el martes?", "¿cuántos llevo este mes?") son preguntas
 * sobre el calendario *local* del usuario, no sobre UTC.
 *
 * El servidor de Vercel corre en UTC, así que agrupar por día usando la fecha
 * del servidor colocaría un entrenamiento de las 01:30 de un martes de agosto
 * en España en el lunes. Este módulo resuelve eso: convierte instantes a fechas
 * civiles (año/mes/día locales) y al revés, para una zona horaria concreta.
 *
 * No hay dependencias externas: `Intl.DateTimeFormat` ya sabe de zonas horarias
 * y de horario de verano.
 */

/** Zona por defecto si el navegador todavía no ha informado de la suya. */
export const DEFAULT_TIME_ZONE = "Europe/Madrid";

/**
 * Cookie donde el navegador deja su zona horaria para que la lea el servidor.
 *
 * Vive aquí, y no junto al código que la lee, porque ese módulo usa
 * `next/headers` y sólo puede cargarse en el servidor: el componente de cliente
 * que escribe la cookie necesita la constante sin arrastrar esa dependencia.
 */
export const TIME_ZONE_COOKIE = "tz";

/** Una fecha del calendario, sin hora ni zona: "el 17 de agosto de 2026". */
export type CivilDate = {
  year: number;
  /** 1-12 */
  month: number;
  /** 1-31 */
  day: number;
};

export type CivilDateTime = CivilDate & {
  hour: number;
  minute: number;
  second: number;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

/**
 * Comprueba que una cadena es una zona horaria IANA válida. Se usa para no
 * confiar ciegamente en la cookie que envía el navegador.
 */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone || timeZone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Descompone un instante en la fecha y hora locales de una zona horaria. */
export function toCivilDateTime(date: Date, timeZone: string): CivilDateTime {
  const parts = partsFormatter(timeZone).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((candidate) => candidate.type === type);
    return part ? Number(part.value) : 0;
  };

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    // Algunos motores devuelven "24" para la medianoche con hour12:false.
    hour: read("hour") % 24,
    minute: read("minute"),
    second: read("second"),
  };
}

export function toCivilDate(date: Date, timeZone: string): CivilDate {
  const { year, month, day } = toCivilDateTime(date, timeZone);
  return { year, month, day };
}

function offsetMs(date: Date, timeZone: string): number {
  const civil = toCivilDateTime(date, timeZone);
  const asIfUtc = Date.UTC(
    civil.year,
    civil.month - 1,
    civil.day,
    civil.hour,
    civil.minute,
    civil.second,
  );
  // El instante no lleva milisegundos en `asIfUtc`, así que los descartamos
  // también del original para que el desfase salga exacto.
  return asIfUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Instante absoluto correspondiente a una hora local de una zona horaria.
 *
 * Se resuelve en dos pasadas: la primera estima el desfase y la segunda lo
 * corrige, que es lo que hace falta para caer bien en los cambios de hora.
 */
export function civilToInstant(civil: CivilDateTime, timeZone: string): Date {
  const asIfUtc = Date.UTC(
    civil.year,
    civil.month - 1,
    civil.day,
    civil.hour,
    civil.minute,
    civil.second,
  );

  const firstGuess = asIfUtc - offsetMs(new Date(asIfUtc), timeZone);
  const correctedOffset = offsetMs(new Date(firstGuess), timeZone);
  return new Date(asIfUtc - correctedOffset);
}

/** Instante en el que empieza un día concreto del calendario local. */
export function startOfCivilDay(civil: CivilDate, timeZone: string): Date {
  return civilToInstant({ ...civil, hour: 0, minute: 0, second: 0 }, timeZone);
}

/** Suma (o resta) días de calendario. Gestiona meses y años automáticamente. */
export function addCivilDays(civil: CivilDate, days: number): CivilDate {
  const shifted = new Date(
    Date.UTC(civil.year, civil.month - 1, civil.day + days),
  );
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function addCivilMonths(civil: CivilDate, months: number): CivilDate {
  const shifted = new Date(Date.UTC(civil.year, civil.month - 1 + months, 1));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: 1,
  };
}

/** 0 = lunes … 6 = domingo (la semana europea). */
export function civilWeekday(civil: CivilDate): number {
  const utcDay = new Date(
    Date.UTC(civil.year, civil.month - 1, civil.day),
  ).getUTCDay();
  return (utcDay + 6) % 7;
}

/** Lunes de la semana a la que pertenece la fecha. */
export function startOfCivilWeek(civil: CivilDate): CivilDate {
  return addCivilDays(civil, -civilWeekday(civil));
}

export function startOfCivilMonth(civil: CivilDate): CivilDate {
  return { year: civil.year, month: civil.month, day: 1 };
}

export function startOfCivilYear(civil: CivilDate): CivilDate {
  return { year: civil.year, month: 1, day: 1 };
}

/** Clave estable "2026-08-17", apta para agrupar y para usar como key de React. */
export function civilDateKey(civil: CivilDate): string {
  const month = String(civil.month).padStart(2, "0");
  const day = String(civil.day).padStart(2, "0");
  return `${civil.year}-${month}-${day}`;
}

export function civilDatesEqual(a: CivilDate, b: CivilDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Días de calendario entre dos fechas (b - a). */
export function civilDaysBetween(a: CivilDate, b: CivilDate): number {
  const msPerDay = 86_400_000;
  const from = Date.UTC(a.year, a.month - 1, a.day);
  const to = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((to - from) / msPerDay);
}
