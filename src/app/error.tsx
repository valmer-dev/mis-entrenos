"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Pantalla de error de la aplicación.
 *
 * Deliberadamente genérica: en producción Next.js censura los mensajes de error
 * del servidor antes de enviarlos al navegador (solo llegan un texto neutro y un
 * `digest`), así que aquí no se puede saber qué ha fallado ni mostrarlo. El
 * `digest` sí se muestra, porque es lo que permite localizar el error concreto
 * en los logs de Vercel.
 *
 * El caso de "falta configurar Supabase" no llega hasta aquí: se detecta en el
 * servidor, en `app/layout.tsx`, antes de que nada intente conectarse.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <span aria-hidden className="text-4xl">
        ⚠️
      </span>

      <h1 className="text-ink mt-4 text-2xl font-semibold tracking-tight text-balance">
        Algo ha ido mal
      </h1>

      <p className="text-ink-secondary mt-3 max-w-sm text-sm text-pretty">
        No hemos podido cargar esta pantalla. Vuelve a intentarlo en un momento.
      </p>

      <Button size="lg" className="mt-8" onClick={reset}>
        Reintentar
      </Button>

      {error.digest ? (
        <p className="text-ink-muted mt-8 text-xs">
          Código del error:{" "}
          <code className="text-ink-secondary">{error.digest}</code>
        </p>
      ) : null}
    </main>
  );
}
