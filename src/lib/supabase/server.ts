import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { getSupabaseEnv } from "./env";

/**
 * Cliente de Supabase para el servidor (Server Components, Server Actions y
 * Route Handlers).
 *
 * La sesión viaja en cookies, así que hay que crear un cliente nuevo por
 * petición: no se puede compartir una instancia global entre usuarios.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Los Server Components no pueden escribir cookies. No pasa nada:
          // el middleware ya refresca la sesión en cada petición.
        }
      },
    },
  });
}

/**
 * Usuario autenticado o `null`.
 *
 * Usa `getUser()` (que valida el token contra Supabase) y nunca `getSession()`,
 * cuyo contenido procede de una cookie y por tanto no es de fiar en el servidor.
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
