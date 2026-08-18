import Link from "next/link";

/**
 * Aviso permanente de que los datos no son reales.
 *
 * Va en todas las pantallas y a propósito no se puede cerrar: el riesgo del
 * modo demostración es confundir sus datos con los propios, así que el aviso
 * tiene que seguir ahí por mucho que uno se acostumbre a verlo.
 */
export function DemoBanner() {
  return (
    <div className="border-border bg-surface-raised mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3">
      <span aria-hidden className="text-lg leading-none">
        🧪
      </span>
      <p className="text-ink-secondary min-w-0 flex-1 text-xs text-pretty">
        <strong className="text-ink font-semibold">Modo demostración.</strong>{" "}
        Estos entrenamientos son de ejemplo y se pierden al cerrar. Conecta
        Supabase para guardar los tuyos.
      </p>
      <Link
        href="/configurar"
        className="text-ink shrink-0 text-xs font-medium underline underline-offset-4"
      >
        Cómo
      </Link>
    </div>
  );
}
