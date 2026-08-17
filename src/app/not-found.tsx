import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-ink-muted text-sm font-semibold">404</p>
      <h1 className="text-ink mt-2 text-2xl font-semibold tracking-tight">
        No encontramos esta página
      </h1>
      <p className="text-ink-secondary mt-2 max-w-xs text-sm text-pretty">
        Puede que el entrenamiento se haya eliminado o que el enlace no sea
        correcto.
      </p>
      <ButtonLink href="/dashboard" size="lg" className="mt-8">
        Volver al dashboard
      </ButtonLink>
    </main>
  );
}
