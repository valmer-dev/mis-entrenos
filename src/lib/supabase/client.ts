import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { getSupabaseEnv } from "./env";

/**
 * Cliente de Supabase para componentes de cliente ("use client").
 *
 * Se usa únicamente para autenticación (login, registro, logout): la lectura y
 * escritura de entrenamientos ocurre siempre en el servidor.
 */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
