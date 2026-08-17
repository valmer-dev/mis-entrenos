import type { Metadata } from "next";

import { HistoryFilters } from "@/components/history/history-filters";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { WorkoutRow } from "@/components/workout/workout-row";
import {
  civilDateKey,
  toCivilDate,
} from "@/lib/date/civil";
import {
  formatDuration,
  formatRelativeDay,
  formatTimeOfDay,
  formatWorkoutCount,
} from "@/lib/date/format";
import { isWorkoutType } from "@/lib/domain/workout";
import {
  getHistory,
  type HistoryFilters as Filters,
  type WorkoutListItem,
} from "@/lib/workouts/queries";

export const metadata: Metadata = {
  title: "Histórico",
};

export const dynamic = "force-dynamic";

const RANGE_VALUES: Filters["range"][] = ["all", "week", "month", "last30"];

function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): Filters {
  const type = searchParams.type;
  const range = searchParams.range;

  return {
    type: isWorkoutType(type) ? type : "all",
    range: RANGE_VALUES.includes(range as Filters["range"])
      ? (range as Filters["range"])
      : "all",
  };
}

type DayGroup = {
  key: string;
  label: string;
  workouts: WorkoutListItem[];
  totalSeconds: number;
};

/**
 * Agrupa por día de calendario del usuario. Los entrenamientos ya llegan
 * ordenados de más reciente a más antiguo, así que basta con recorrerlos una
 * vez y abrir un grupo nuevo cada vez que cambia la fecha.
 */
function groupByDay(
  workouts: WorkoutListItem[],
  now: Date,
  timeZone: string,
): DayGroup[] {
  const groups: DayGroup[] = [];

  for (const workout of workouts) {
    const startedAt = new Date(workout.started_at);
    const key = civilDateKey(toCivilDate(startedAt, timeZone));
    const lastGroup = groups.at(-1);

    if (lastGroup?.key === key) {
      lastGroup.workouts.push(workout);
      lastGroup.totalSeconds += workout.duration_seconds ?? 0;
      continue;
    }

    groups.push({
      key,
      label: formatRelativeDay(startedAt, now, timeZone),
      workouts: [workout],
      totalSeconds: workout.duration_seconds ?? 0,
    });
  }

  return groups;
}

export default async function HistoryPage({
  searchParams,
}: PageProps<"/historico">) {
  const resolvedSearchParams = await searchParams;
  const filters = parseFilters(resolvedSearchParams);

  const { workouts, timeZone, hasAnyWorkout } = await getHistory(filters);
  const now = new Date();
  const groups = groupByDay(workouts, now, timeZone);

  const totalSeconds = workouts.reduce(
    (total, workout) => total + (workout.duration_seconds ?? 0),
    0,
  );

  if (!hasAnyWorkout) {
    return (
      <div className="space-y-8">
        <PageHeader title="Mis entrenamientos" />
        <EmptyState
          title="Todavía no tienes entrenamientos"
          description="Cuando termines tu primer entrenamiento aparecerá aquí."
          action={
            <ButtonLink href="/entrenar" size="hero">
              COMENZAR ENTRENAMIENTO
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis entrenamientos"
        subtitle={
          workouts.length > 0
            ? `${formatWorkoutCount(workouts.length)} · ${formatDuration(totalSeconds)}`
            : undefined
        }
      />

      <HistoryFilters active={filters} />

      {groups.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Sin resultados"
          description="No hay entrenamientos que coincidan con estos filtros."
          action={
            <ButtonLink href="/historico" variant="secondary" size="lg" className="w-full">
              Quitar filtros
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.key}>
              <header className="mb-1 flex items-baseline justify-between gap-3">
                <h2 className="text-ink text-sm font-semibold">{group.label}</h2>
                <span className="text-ink-muted text-xs tabular-nums">
                  {formatDuration(group.totalSeconds)}
                </span>
              </header>

              <ul className="divide-border bg-surface border-border rounded-card divide-y border px-3">
                {group.workouts.map((workout) => (
                  <li key={workout.id}>
                    <WorkoutRow
                      workout={workout}
                      meta={formatTimeOfDay(
                        new Date(workout.started_at),
                        timeZone,
                      )}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
