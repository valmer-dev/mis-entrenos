import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_TIME_ZONE, TIME_ZONE_COOKIE, isValidTimeZone } from "./civil";

/**
 * Zona horaria del usuario, leída en el servidor.
 *
 * El servidor de Vercel corre en UTC, así que agrupar entrenamientos por día
 * usando su reloj colocaría un entrenamiento de la 01:30 del martes en el lunes.
 * El navegador deja su zona en la cookie `tz` (ver `TimeZoneSync`) y aquí se
 * lee, para que todos los cálculos del dashboard usen el calendario real del
 * usuario.
 *
 * El valor lo envía el cliente, así que se valida antes de usarlo.
 */
export async function getUserTimeZone(): Promise<string> {
  const cookieStore = await cookies();
  const value = cookieStore.get(TIME_ZONE_COOKIE)?.value;

  return value && isValidTimeZone(value) ? value : DEFAULT_TIME_ZONE;
}
