import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { SupabaseSetupNotice } from "@/components/app/supabase-setup-notice";
import { hasSupabaseEnv } from "@/lib/supabase/env";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mis Entrenos",
    template: "%s · Mis Entrenos",
  },
  description:
    "Registra tus entrenamientos, controla el tiempo y consulta tus estadísticas.",
  applicationName: "Mis Entrenos",
  appleWebApp: {
    capable: true,
    title: "Mis Entrenos",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  // La aplicación se usa en movimiento: se evita el zoom accidental al tocar
  // botones, pero no se bloquea el zoom manual del usuario.
  initialScale: 1,
  width: "device-width",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Sin configuración de Supabase no hay nada que la aplicación pueda hacer, así
  // que se sustituye por instrucciones en lugar de dejar que reviente ruta por
  // ruta. Se comprueba aquí, en el servidor, porque en producción Next.js
  // censura los mensajes de error y un `error.tsx` no podría distinguir este
  // caso de cualquier otro fallo.
  const isConfigured = hasSupabaseEnv();

  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="bg-plane text-ink flex min-h-full flex-col">
        {isConfigured ? children : <SupabaseSetupNotice />}
      </body>
    </html>
  );
}
