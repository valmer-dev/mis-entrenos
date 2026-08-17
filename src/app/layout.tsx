import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

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
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="bg-plane text-ink flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
