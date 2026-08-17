"use client";

import { useEffect, useState } from "react";

/**
 * Segundos transcurridos desde `startedAt`.
 *
 * El tiempo NO se lleva sumando uno cada segundo: se recalcula siempre como
 * `ahora − started_at`. La diferencia importa mucho en la práctica, porque los
 * navegadores móviles congelan los temporizadores de las pestañas en segundo
 * plano y bloquean la pantalla durante el entrenamiento. Con un contador
 * incremental el cronómetro se quedaría corto; recalculando desde la marca de
 * tiempo, al volver a la aplicación el valor es siempre exacto.
 *
 * El intervalo de un segundo sólo sirve para repintar. Además se recalcula al
 * volver a la pestaña o a la ventana, para que el salto sea inmediato y no haya
 * que esperar al siguiente tick.
 */
export function useElapsedSeconds(startedAt: string): number {
  const startedAtMs = Date.parse(startedAt);

  const [elapsed, setElapsed] = useState(() => elapsedFrom(startedAtMs));

  useEffect(() => {
    const update = () => setElapsed(elapsedFrom(startedAtMs));

    update();
    const intervalId = window.setInterval(update, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") update();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", update);
    window.addEventListener("pageshow", update);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", update);
      window.removeEventListener("pageshow", update);
    };
  }, [startedAtMs]);

  return elapsed;
}

function elapsedFrom(startedAtMs: number): number {
  if (!Number.isFinite(startedAtMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
}
