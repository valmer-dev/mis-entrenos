import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Se ejecuta antes de cada petición: refresca la sesión de Supabase y protege
 * las rutas privadas. En Next.js 16 esta convención se llama `proxy`
 * (antes `middleware`).
 */
export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todas las rutas salvo los ficheros estáticos y las imágenes, que no
     * necesitan sesión y sólo añadirían latencia.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
