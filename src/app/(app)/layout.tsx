import { BottomNav, SideNav } from "@/components/app/app-nav";
import { DemoBanner } from "@/components/app/demo-banner";
import { TimeZoneSync } from "@/components/app/time-zone-sync";
import { ActiveWorkoutBanner } from "@/components/workout/active-workout-banner";
import { isDemoMode } from "@/lib/demo/store";
import { getActiveWorkout } from "@/lib/workouts/queries";

/**
 * Marco de la aplicación autenticada.
 *
 * El entrenamiento activo se consulta aquí, una sola vez, para que el aviso
 * aparezca en cualquier pantalla: al abrir la aplicación siempre se ve si hay
 * algo en marcha.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const activeWorkout = await getActiveWorkout();
  const demo = isDemoMode();

  return (
    <>
      <TimeZoneSync />
      <SideNav />

      <div className="flex min-h-full flex-1 flex-col md:pl-60">
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-6 pb-24 sm:px-6 md:max-w-3xl md:pb-10">
          {demo ? <DemoBanner /> : null}
          {activeWorkout ? <ActiveWorkoutBanner workout={activeWorkout} /> : null}
          {children}
        </main>
      </div>

      <BottomNav />
    </>
  );
}
