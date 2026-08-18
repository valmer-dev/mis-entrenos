import type { Metadata } from "next";
import { cookies } from "next/headers";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isDemoMode } from "@/lib/demo/store";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { toCivilDate } from "@/lib/date/civil";
import { formatCivilDate, formatDuration } from "@/lib/date/format";
import { getUserTimeZone } from "@/lib/date/timezone";
import { signOut } from "@/lib/auth/actions";
import { THEME_COOKIE, parseTheme } from "@/lib/theme/theme";
import { getProfileSummary } from "@/lib/workouts/queries";

export const metadata: Metadata = {
  title: "Perfil",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getProfileSummary();
  const timeZone = await getUserTimeZone();
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" />

      <Card>
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="bg-surface-raised text-ink flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold"
          >
            {(profile.displayName ?? profile.email).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            {profile.displayName ? (
              <p className="text-ink truncate text-base font-semibold">
                {profile.displayName}
              </p>
            ) : null}
            <p className="text-ink-secondary truncate text-sm">
              {profile.email}
            </p>
            <p className="text-ink-muted mt-0.5 text-xs">
              Desde el{" "}
              {formatCivilDate(
                toCivilDate(new Date(profile.memberSince), timeZone),
              )}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Entrenamientos"
          value={String(profile.totalWorkouts)}
          hint="En total"
        />
        <StatCard
          label="Tiempo entrenando"
          value={formatDuration(profile.totalSeconds)}
          hint="En total"
        />
      </div>

      <Card>
        <h2 className="text-ink mb-1 text-sm font-semibold">Apariencia</h2>
        <p className="text-ink-muted mb-4 text-xs">
          &quot;Sistema&quot; sigue la configuración de tu móvil.
        </p>
        <ThemeToggle initialTheme={theme} />
      </Card>

      {/*
        En modo demostración no hay sesión que cerrar; lo útil ahí es explicar
        cómo conectar Supabase para empezar a guardar entrenamientos de verdad.
      */}
      {isDemoMode() ? (
        <ButtonLink
          href="/configurar"
          variant="secondary"
          size="lg"
          className="w-full"
        >
          Conectar Supabase
        </ButtonLink>
      ) : (
        <form action={signOut}>
          <Button type="submit" variant="secondary" size="lg" className="w-full">
            Cerrar sesión
          </Button>
        </form>
      )}
    </div>
  );
}
