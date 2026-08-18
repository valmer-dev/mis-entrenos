import type { Metadata } from "next";

import { SupabaseSetupNotice } from "@/components/app/supabase-setup-notice";

export const metadata: Metadata = {
  title: "Configurar Supabase",
};

/** Instrucciones de configuración, enlazadas desde el aviso del modo demo. */
export default function ConfigurePage() {
  return <SupabaseSetupNotice />;
}
