"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Pantalla de error de la aplicación.
 *
 * El caso más probable en una instalación nueva es que falten las variables de
 * entorno de Supabase, así que se detecta y se explica qué hacer en lugar de
 * mostrar un error genérico.
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

  const isConfigurationError = error.message.includes("Supabase");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <span aria-hidden className="text-4xl">
        {isConfigurationError ? "⚙️" : "⚠️"}
      </span>

      <h1 className="text-ink mt-4 text-2xl font-semibold tracking-tight text-balance">
        {isConfigurationError
          ? "Falta configurar Supabase"
          : "Algo ha ido mal"}
      </h1>

      <p className="text-ink-secondary mt-3 max-w-sm text-sm text-pretty">
        {isConfigurationError
          ? "Copia .env.example a .env.local, rellena NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY con los datos de tu proyecto y reinicia el servidor."
          : "No hemos podido cargar esta pantalla. Vuelve a intentarlo en un momento."}
      </p>

      <Button size="lg" className="mt-8" onClick={reset}>
        Reintentar
      </Button>
    </main>
  );
}
