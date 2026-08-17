"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { TIME_ZONE_COOKIE } from "@/lib/date/civil";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Informa al servidor de la zona horaria del navegador.
 *
 * Sin esto, el servidor (que corre en UTC) agruparía los entrenamientos por
 * días equivocados. Se escribe una sola vez: si la cookie ya coincide, no hace
 * nada y no se recarga nada.
 */
export function TimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return;

    const current = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${TIME_ZONE_COOKIE}=`))
      ?.slice(TIME_ZONE_COOKIE.length + 1);

    if (current === timeZone) return;

    // Los nombres IANA ("Europe/Madrid") son válidos como valor de cookie sin
    // codificar, y así el servidor los lee tal cual.
    document.cookie = `${TIME_ZONE_COOKIE}=${timeZone}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;

    // Vuelve a pedir la página para que las estadísticas se recalculen con la
    // zona correcta.
    router.refresh();
  }, [router]);

  return null;
}
