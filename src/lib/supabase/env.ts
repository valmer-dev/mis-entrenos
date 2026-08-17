/**
 * Variables de entorno de Supabase.
 *
 * Se leen de forma literal (`process.env.NEXT_PUBLIC_…`) porque Next.js
 * sustituye estas expresiones en tiempo de compilación; un acceso dinámico
 * dejaría las variables vacías en el navegador.
 *
 * Ambas son públicas por diseño: la URL del proyecto y la clave `anon` están
 * pensadas para viajar al cliente, y lo que protege los datos son las políticas
 * RLS. La `service_role` key NO se usa en ningún punto de la aplicación y no
 * debe añadirse jamás a una variable `NEXT_PUBLIC_`.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

/**
 * Devuelve la configuración o lanza un error explicativo. Falla pronto y con un
 * mensaje claro es mucho mejor que un "Invalid API key" a mitad de una consulta.
 */
export function getSupabaseEnv(): SupabaseEnv {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const missing = [
      !SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
      !SUPABASE_ANON_KEY && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]
      .filter(Boolean)
      .join(", ");

    throw new Error(
      `Falta configuración de Supabase (${missing}). ` +
        "Copia .env.example a .env.local y rellena los valores del proyecto. " +
        "Los encontrarás en Supabase → Project Settings → API.",
    );
  }

  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}

/** Permite mostrar una pantalla de ayuda en lugar de reventar si falta config. */
export function hasSupabaseEnv(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
