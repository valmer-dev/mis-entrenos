import type { Metadata } from "next";
import Link from "next/link";

import { ActivityBarChart } from "@/components/charts/activity-bar-chart";
import {
  DistributionList,
  type DistributionItem,
} from "@/components/charts/distribution-list";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { HighlightCard, StatCard } from "@/components/ui/stat-card";
import { WorkoutRow } from "@/components/workout/workout-row";
import {
  formatDuration,
  formatRelativeDay,
  formatTimeOfDay,
  formatWorkoutCount,
} from "@/lib/date/format";
import {
  parsePeriodId,
  periodChartTitle,
  periodLabel,
} from "@/lib/domain/periods";
import {
  gymTypeLabel,
  workoutTitle,
  workoutTypeIcon,
  workoutTypeLabel,
} from "@/lib/domain/workout";
import { getDashboardData } from "@/lib/workouts/queries";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Las estadísticas dependen de la sesión y del momento actual.
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { period } = await searchParams;
  const periodId = parsePeriodId(period);

  const {
    stats,
    recentWorkouts,
    lastWorkout,
    workoutsThisWeek,
    hasAnyWorkout,
    timeZone,
  } = await getDashboardData(periodId);

  const now = new Date();

  // Usuario nuevo: no tiene sentido enseñar gráficas a cero.
  if (!hasAnyWorkout) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dashboard" />
        <EmptyState
          title="Todavía no tienes entrenamientos"
          description="Empieza tu primer entrenamiento y aquí podrás ver tus estadísticas."
          action={
            <ButtonLink href="/entrenar" size="hero">
              COMENZAR ENTRENAMIENTO
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const typeItems: DistributionItem[] = stats.typeBreakdown.map((entry) => ({
    key: entry.type,
    icon: workoutTypeIcon(entry.type),
    label: workoutTypeLabel(entry.type),
    count: entry.count,
    totalSeconds: entry.totalSeconds,
  }));

  const gymItems: DistributionItem[] = stats.gymBreakdown.map((entry) => ({
    key: entry.gymType,
    label: gymTypeLabel(entry.gymType),
    count: entry.count,
    totalSeconds: entry.totalSeconds,
  }));

  const hasDataInPeriod = stats.totalWorkouts > 0;
  const longest = stats.longestWorkout;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Tu actividad de un vistazo." />

      <PeriodFilter active={periodId} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Entrenamientos"
          value={String(stats.totalWorkouts)}
          hint={periodLabel(periodId)}
        />
        <StatCard
          label="Tiempo entrenando"
          value={formatDuration(stats.totalSeconds)}
          hint={periodLabel(periodId)}
        />
        <StatCard
          label="Esta semana"
          value={String(workoutsThisWeek)}
          hint={workoutsThisWeek === 1 ? "entrenamiento" : "entrenamientos"}
        />
        <StatCard
          label="Media por entreno"
          value={
            hasDataInPeriod ? formatDuration(stats.averageSeconds) : "—"
          }
          hint={periodLabel(periodId)}
        />
      </div>

      {lastWorkout ? (
        <HighlightCard
          label="Último entrenamiento"
          icon={workoutTypeIcon(lastWorkout.type)}
          title={workoutTitle(lastWorkout)}
          meta={`${formatRelativeDay(new Date(lastWorkout.started_at), now, timeZone)} · ${formatTimeOfDay(new Date(lastWorkout.started_at), timeZone)}`}
          value={formatDuration(lastWorkout.duration_seconds)}
        />
      ) : null}

      {hasDataInPeriod ? (
        <>
          <Card>
            <CardHeader
              title={periodChartTitle(periodId)}
              subtitle={`${formatWorkoutCount(stats.totalWorkouts)} · ${formatDuration(stats.totalSeconds)}`}
            />
            <ActivityBarChart
              buckets={stats.activity.buckets}
              maxCount={stats.activity.maxCount}
            />
          </Card>

          <Card>
            <CardHeader
              title="Por actividad"
              subtitle="Entrenamientos y tiempo dedicado a cada una"
            />
            <DistributionList items={typeItems} />
          </Card>

          {gymItems.length > 0 ? (
            <Card>
              <CardHeader
                title="Gym por grupo muscular"
                subtitle="Qué estás entrenando más"
              />
              <DistributionList items={gymItems} />
            </Card>
          ) : null}

          {longest ? (
            <HighlightCard
              label="Entrenamiento más largo"
              icon={workoutTypeIcon(longest.type)}
              title={workoutTitle(longest)}
              meta={formatRelativeDay(
                new Date(longest.started_at),
                now,
                timeZone,
              )}
              value={formatDuration(longest.duration_seconds)}
            />
          ) : null}
        </>
      ) : (
        <Card>
          <p className="text-ink text-sm font-semibold">
            Sin entrenamientos en este periodo
          </p>
          <p className="text-ink-secondary mt-1 text-sm">
            Prueba con otro periodo o empieza uno nuevo.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href="/entrenar" size="md">
              Comenzar entrenamiento
            </ButtonLink>
            <ButtonLink href="/dashboard?period=all" variant="secondary" size="md">
              Ver todo
            </ButtonLink>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Últimos entrenamientos"
          action={
            <Link
              href="/historico"
              className="text-ink-secondary hover:text-ink text-xs font-medium underline underline-offset-4"
            >
              Ver todo
            </Link>
          }
        />

        <ul className="divide-border divide-y">
          {recentWorkouts.map((workout) => (
            <li key={workout.id} className="first:-mt-1 last:-mb-1">
              <WorkoutRow
                workout={workout}
                meta={`${formatRelativeDay(new Date(workout.started_at), now, timeZone)} · ${formatTimeOfDay(new Date(workout.started_at), timeZone)}`}
              />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
