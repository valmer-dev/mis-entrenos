/**
 * Preferencia de tema del usuario.
 *
 * Se guarda en una cookie, no en `localStorage`, y esto es deliberado: el
 * servidor la lee y pinta el `data-theme` correcto en el HTML inicial. Con
 * `localStorage` habría que leerlo ya en el navegador, y la página aparecería
 * un instante con el tema equivocado antes de corregirse.
 *
 * "system" no escribe ningún atributo: manda `prefers-color-scheme`.
 */

export const THEME_COOKIE = "theme";

export const THEMES = ["system", "light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "system";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && THEMES.includes(value as Theme);
}

export function parseTheme(value: unknown): Theme {
  return isTheme(value) ? value : DEFAULT_THEME;
}

export const THEME_LABELS: Record<Theme, string> = {
  system: "Sistema",
  light: "Claro",
  dark: "Oscuro",
};
