import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";

import { THEME_COOKIE, parseTheme } from "@/lib/theme/theme";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Workout Tracker",
    template: "%s · Workout Tracker",
  },
  description:
    "Registra tus entrenamientos, controla el tiempo y consulta tus estadísticas.",
  applicationName: "Workout Tracker",
  appleWebApp: {
    capable: true,
    title: "Workout Tracker",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  // El color de la barra del navegador sigue al tema del sistema.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
  // La aplicación se usa en movimiento: se evita el zoom accidental al tocar
  // botones, pero no se bloquea el zoom manual del usuario.
  initialScale: 1,
  width: "device-width",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // El tema se resuelve en el servidor para que el HTML llegue ya pintado. Si
  // se decidiera en el navegador, la página aparecería un instante con el tema
  // equivocado. "system" no escribe atributo: manda `prefers-color-scheme`.
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <html
      lang="es"
      data-theme={theme === "system" ? undefined : theme}
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="bg-plane text-ink flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
