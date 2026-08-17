/**
 * Pantalla que se muestra cuando faltan las variables de entorno de Supabase.
 *
 * Se decide en el servidor (ver `app/layout.tsx`) antes de que nada intente
 * conectarse. Esto es importante: en producción Next.js censura los mensajes de
 * error del servidor antes de enviarlos al navegador, así que un `error.tsx` no
 * puede saber *por qué* ha fallado algo. Comprobándolo antes, el aviso es fiable
 * tanto en local como en producción.
 */
export function SupabaseSetupNotice() {
  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <span aria-hidden className="text-4xl">
          ⚙️
        </span>

        <h1 className="text-ink mt-4 text-2xl font-semibold tracking-tight text-balance">
          Falta configurar Supabase
        </h1>

        <p className="text-ink-secondary mt-3 text-sm text-pretty">
          La aplicación está desplegada correctamente, pero todavía no sabe a qué
          base de datos conectarse.
        </p>

        <ol className="text-ink-secondary mt-6 space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="bg-surface-raised text-ink flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              1
            </span>
            <span>
              En Supabase, ejecuta{" "}
              <code className="bg-surface-raised text-ink rounded px-1.5 py-0.5 text-xs">
                supabase/migrations/0001_init.sql
              </code>{" "}
              en el <strong className="text-ink">SQL Editor</strong>.
            </span>
          </li>

          <li className="flex gap-3">
            <span className="bg-surface-raised text-ink flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              2
            </span>
            <span>
              Copia la URL del proyecto y la clave{" "}
              <code className="bg-surface-raised text-ink rounded px-1.5 py-0.5 text-xs">
                anon public
              </code>{" "}
              de <strong className="text-ink">Project Settings → API</strong>.
            </span>
          </li>

          <li className="flex gap-3">
            <span className="bg-surface-raised text-ink flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              3
            </span>
            <span>
              Defínelas como variables de entorno y vuelve a desplegar:
              <span className="mt-2 block space-y-1">
                <code className="bg-surface-raised text-ink block rounded px-2 py-1 text-xs break-all">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>
                <code className="bg-surface-raised text-ink block rounded px-2 py-1 text-xs break-all">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>
              </span>
            </span>
          </li>
        </ol>

        <p className="text-ink-muted mt-6 text-xs text-pretty">
          En local basta con copiar{" "}
          <code className="text-ink-secondary">.env.example</code> a{" "}
          <code className="text-ink-secondary">.env.local</code> y reiniciar el
          servidor. En Vercel, añádelas en Settings → Environment Variables; los
          cambios se aplican en el siguiente despliegue.
        </p>
      </div>
    </main>
  );
}
