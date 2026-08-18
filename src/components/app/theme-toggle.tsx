"use client";

import { useEffect, useState } from "react";

import {
  THEMES,
  THEME_COOKIE,
  THEME_LABELS,
  type Theme,
} from "@/lib/theme/theme";
import { cn } from "@/lib/utils/cn";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

type ThemeToggleProps = {
  /** Tema que ha pintado el servidor, leído de la cookie. */
  initialTheme: Theme;
};

const ICONS: Record<Theme, React.ReactElement> = {
  system: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path d="M8.5 20.5h7" />
    </svg>
  ),
  light: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  ),
};

/**
 * Selector de tema.
 *
 * El cambio se aplica en el acto tocando el atributo del `<html>`, sin recargar
 * ni esperar al servidor. La cookie se escribe a la vez para que la próxima
 * visita ya se sirva pintada con el tema correcto desde el primer byte.
 */
export function ThemeToggle({ initialTheme }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  // El atributo del `<html>` y la cookie se sincronizan desde un efecto: son
  // dos cosas de fuera de React, y tocarlas durante el render es justo lo que
  // desaconseja el compilador.
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "system") {
      // Sin atributo manda la preferencia del sistema operativo.
      delete root.dataset.theme;
    } else {
      root.dataset.theme = theme;
    }

    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  }, [theme]);

  return (
    <div
      role="radiogroup"
      aria-label="Tema de la aplicación"
      className="bg-surface-raised border-border flex gap-1 rounded-full border p-1"
    >
      {THEMES.map((option) => {
        const isActive = option === theme;

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(option)}
            className={cn(
              "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-medium transition-colors",
              isActive
                ? "bg-accent text-plane"
                : "text-ink-secondary hover:text-ink",
            )}
          >
            {ICONS[option]}
            {THEME_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
