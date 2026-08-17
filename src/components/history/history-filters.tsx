"use client";

import Link from "next/link";

import type { HistoryFilters as Filters } from "@/lib/workouts/queries";
import { WORKOUT_TYPES } from "@/lib/domain/workout";
import { cn } from "@/lib/utils/cn";

type HistoryFiltersProps = {
  active: Filters;
};

const RANGE_OPTIONS: readonly { value: Filters["range"]; label: string }[] = [
  { value: "all", label: "Siempre" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "last30", label: "Últimos 30 días" },
] as const;

function buildHref(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.range !== "all") params.set("range", filters.range);

  const query = params.toString();
  return query ? `/historico?${query}` : "/historico";
}

function FilterRow({
  label,
  options,
  isActive,
  hrefFor,
}: {
  label: string;
  options: readonly { value: string; label: string }[];
  isActive: (value: string) => boolean;
  hrefFor: (value: string) => string;
}) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
      <ul className="flex w-max gap-2">
        {options.map((option) => {
          const active = isActive(option.value);

          return (
            <li key={option.value}>
              <Link
                href={hrefFor(option.value)}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-accent bg-accent text-plane"
                    : "border-border bg-surface text-ink-secondary hover:border-border-strong hover:text-ink",
                )}
              >
                {option.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Filtros del histórico: actividad y rango temporal.
 *
 * Ambos viven en la URL, así que cambiar uno conserva el otro y el estado
 * sobrevive a recargas y al botón "atrás" del navegador.
 */
export function HistoryFilters({ active }: HistoryFiltersProps) {
  const typeOptions = [
    { value: "all", label: "Todos" },
    ...WORKOUT_TYPES.map((definition) => ({
      value: definition.value,
      label: definition.label,
    })),
  ];

  return (
    <div className="space-y-2">
      <FilterRow
        label="Filtrar por actividad"
        options={typeOptions}
        isActive={(value) => value === active.type}
        hrefFor={(value) =>
          buildHref({ ...active, type: value as Filters["type"] })
        }
      />
      <FilterRow
        label="Filtrar por fecha"
        options={RANGE_OPTIONS}
        isActive={(value) => value === active.range}
        hrefFor={(value) =>
          buildHref({ ...active, range: value as Filters["range"] })
        }
      />
    </div>
  );
}
