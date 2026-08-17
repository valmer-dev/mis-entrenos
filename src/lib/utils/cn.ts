type ClassValue = string | false | null | undefined;

/** Une clases condicionales descartando las vacías. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
