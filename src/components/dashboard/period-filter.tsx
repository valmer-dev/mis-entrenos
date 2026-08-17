"use client";

import Link from "next/link";

import { PERIODS, type PeriodId } from "@/lib/domain/periods";
import { cn } from "@/lib/utils/cn";

type PeriodFilterProps = {
  active: PeriodId;
};

/**
 * Selector de periodo del dashboard.
 *
 * Una única fila de filtros encima de todo lo que afecta: al cambiarla se
 * recalculan todas las tarjetas y gráficas de golpe. El periodo vive en la URL
 * (`?period=`), así que se puede compartir o recargar sin perderlo.
 *
 * Son enlaces y no botones para que funcionen también con el teclado, con
 * "abrir en pestaña nueva" y sin JavaScript.
 */
export function PeriodFilter({ active }: PeriodFilterProps) {
  return (
    <nav
      aria-label="Periodo de análisis"
      className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6"
    >
      <ul className="flex w-max gap-2">
        {PERIODS.map((period) => {
          const isActive = period.id === active;

          return (
            <li key={period.id}>
              <Link
                href={`/dashboard?period=${period.id}`}
                scroll={false}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "border-accent bg-accent text-plane"
                    : "border-border bg-surface text-ink-secondary hover:border-border-strong hover:text-ink",
                )}
              >
                {period.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
