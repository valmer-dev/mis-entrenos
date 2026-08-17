import {
  type CivilDate,
  civilDatesEqual,
  civilDaysBetween,
  toCivilDate,
  toCivilDateTime,
} from "./civil";

/**
 * Formateo de fechas y duraciones en castellano.
 *
 * Las etiquetas se escriben a mano en lugar de delegar en `Intl` con locale
 * "es" para que el resultado sea idéntico en el servidor y en el navegador
 * (evita cualquier diferencia de datos de locale que provoque errores de
 * hidratación) y para poder usar exactamente las abreviaturas que queremos.
 */

const WEEKDAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const WEEKDAY_LONG = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const MONTH_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const MONTH_LONG = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function weekdayShortLabel(weekdayIndex: number): string {
  return WEEKDAY_SHORT[weekdayIndex] ?? "";
}

export function weekdayLongLabel(weekdayIndex: number): string {
  return WEEKDAY_LONG[weekdayIndex] ?? "";
}

export function monthShortLabel(month: number): string {
  return MONTH_SHORT[month - 1] ?? "";
}

export function monthLongLabel(month: number): string {
  return MONTH_LONG[month - 1] ?? "";
}

/**
 * Duración legible: "1h 12min", "45min", "18h 42min".
 * Es el formato de lectura rápida del dashboard y de las listas.
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "—";

  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    // Un entrenamiento de menos de un minuto sigue siendo un entrenamiento.
    if (minutes === 0) return seconds > 0 ? "<1min" : "0min";
    return `${minutes}min`;
  }

  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}min`;
}

/**
 * Duración en formato cronómetro: "01:12:34".
 * Se usa en el cronómetro en marcha y en la pantalla de entrenamiento
 * completado, donde interesa el segundo exacto.
 */
export function formatStopwatch(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;

  return [hours, minutes, remainder]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

/** "17/08/2026" */
export function formatCivilDate(civil: CivilDate): string {
  const day = String(civil.day).padStart(2, "0");
  const month = String(civil.month).padStart(2, "0");
  return `${day}/${month}/${civil.year}`;
}

/** "12 Ago" o "12 Ago 2025" si el año no es el actual. */
export function formatCivilDateShort(
  civil: CivilDate,
  currentYear: number,
): string {
  const base = `${civil.day} ${monthShortLabel(civil.month)}`;
  return civil.year === currentYear ? base : `${base} ${civil.year}`;
}

/**
 * Etiqueta relativa para listas: "Hoy", "Ayer" o la fecha corta.
 * `now` se pasa explícitamente para que la función sea pura y testeable.
 */
export function formatRelativeDay(
  date: Date,
  now: Date,
  timeZone: string,
): string {
  const target = toCivilDate(date, timeZone);
  const today = toCivilDate(now, timeZone);

  if (civilDatesEqual(target, today)) return "Hoy";

  const difference = civilDaysBetween(target, today);
  if (difference === 1) return "Ayer";
  if (difference === -1) return "Mañana";

  return formatCivilDateShort(target, today.year);
}

/** "19:32" en la zona horaria del usuario. */
export function formatTimeOfDay(date: Date, timeZone: string): string {
  const civil = toCivilDateTime(date, timeZone);
  const hour = String(civil.hour).padStart(2, "0");
  const minute = String(civil.minute).padStart(2, "0");
  return `${hour}:${minute}`;
}

/** "Lunes, 17 de agosto de 2026" — cabecera de la pantalla de detalle. */
export function formatFullDate(date: Date, timeZone: string): string {
  const civil = toCivilDate(date, timeZone);
  const utcDay = new Date(
    Date.UTC(civil.year, civil.month - 1, civil.day),
  ).getUTCDay();
  const weekday = weekdayLongLabel((utcDay + 6) % 7);
  const month = monthLongLabel(civil.month).toLowerCase();
  return `${weekday}, ${civil.day} de ${month} de ${civil.year}`;
}

/** "4 entrenamientos" / "1 entrenamiento" */
export function formatWorkoutCount(count: number): string {
  return count === 1 ? "1 entrenamiento" : `${count} entrenamientos`;
}
