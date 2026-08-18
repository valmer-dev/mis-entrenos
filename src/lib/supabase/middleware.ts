import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { hasSupabaseEnv, getSupabaseEnv } from "./env";

/** Rutas accesibles sin haber iniciado sesión. */
const PUBLIC_ROUTES = ["/login", "/registro", "/configurar"];

/** Rutas de autenticación, que en modo demostración no tienen sentido. */
const AUTH_ROUTES = ["/login", "/registro"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Refresca la sesión de Supabase y protege las rutas privadas.
 *
 * Se ejecuta en cada petición (ver `src/middleware.ts`). Hace dos cosas:
 *
 *  1. Renueva el token de acceso si ha caducado y reescribe las cookies, de
 *     modo que los Server Components siempre reciban una sesión válida.
 *  2. Redirige: sin sesión no se entra a la aplicación, y con sesión no se
 *     vuelve al login.
 *
 * La comprobación de aquí es una barrera de navegación, no la de seguridad:
 * quien realmente impide leer datos ajenos es RLS en la base de datos.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Modo demostración: sin Supabase no hay sesión que refrescar ni que proteger.
  // Se deja pasar todo y se redirige el login, que ahí no lleva a ninguna parte.
  if (!hasSupabaseEnv()) {
    const { pathname } = request.nextUrl;

    if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }

    return response;
  }

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Importante: no ejecutar código entre createServerClient y getUser(). Si la
  // sesión se refresca a destiempo, se pierden las cookies nuevas.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    // Guardamos a dónde iba para volver ahí después de iniciar sesión.
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPublicRoute(pathname)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
