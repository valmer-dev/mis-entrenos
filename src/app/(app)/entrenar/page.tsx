import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { ActiveWorkoutScreen } from "@/components/workout/active-workout-screen";
import { StartWorkoutFlow } from "@/components/workout/start-workout-flow";
import { formatTimeOfDay } from "@/lib/date/format";
import { getUserTimeZone } from "@/lib/date/timezone";
import { getActiveWorkout } from "@/lib/workouts/queries";

export const metadata: Metadata = {
  title: "Entrenar",
};

// El entrenamiento activo cambia constantemente: nunca se sirve desde caché.
export const dynamic = "force-dynamic";

export default async function TrainPage() {
  const activeWorkout = await getActiveWorkout();

  if (activeWorkout) {
    const timeZone = await getUserTimeZone();

    return (
      <ActiveWorkoutScreen
        workout={activeWorkout}
        startedAtLabel={formatTimeOfDay(
          new Date(activeWorkout.started_at),
          timeZone,
        )}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Entrenar"
        subtitle="Registra tu entrenamiento con el cronómetro."
      />
      <StartWorkoutFlow />
    </div>
  );
}
