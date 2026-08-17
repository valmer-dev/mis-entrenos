import { describe, expect, it } from "vitest";

import { resolvePeriodRange } from "@/lib/domain/periods";

import { computeDashboardStats, type WorkoutForStats } from "./dashboard";

const MADRID = "Europe/Madrid";

/** Lunes 17 de agosto de 2026, 20:00 hora de Madrid. */
const NOW = new Date("2026-08-17T18:00:00Z");

let idCounter = 0;

function workout(
  startedAt: string,
  durationSeconds: number,
  overrides: Partial<WorkoutForStats> = {},
): WorkoutForStats {
  idCounter += 1;
  return {
    id: `w${idCounter}`,
    type: "gym",
    gym_type: "espalda",
    started_at: startedAt,
    duration_seconds: durationSeconds,
    ...overrides,
  };
}

function statsFor(workouts: WorkoutForStats[], period: "week" | "month" | "year" | "all" = "week") {
  return computeDashboardStats(
    workouts,
    resolvePeriodRange(period, NOW, MADRID),
    NOW,
    MADRID,
  );
}

describe("totales", () => {
  it("suma entrenamientos, tiempo y media", () => {
    const stats = statsFor([
      workout("2026-08-17T08:00:00Z", 3600),
      workout("2026-08-17T16:00:00Z", 1800),
    ]);

    expect(stats.totalWorkouts).toBe(2);
    expect(stats.totalSeconds).toBe(5400);
    expect(stats.averageSeconds).toBe(2700);
  });

  it("un usuario sin entrenamientos da cero, nunca NaN", () => {
    const stats = statsFor([]);

    expect(stats.totalWorkouts).toBe(0);
    expect(stats.totalSeconds).toBe(0);
    expect(stats.averageSeconds).toBe(0);
    expect(stats.longestWorkout).toBeNull();
    expect(stats.typeBreakdown).toEqual([]);
    expect(stats.gymBreakdown).toEqual([]);
  });
});

describe("reparto por actividad", () => {
  it("agrupa por tipo y ordena de más a menos frecuente", () => {
    const stats = statsFor([
      workout("2026-08-17T08:00:00Z", 3600, { type: "bike", gym_type: null }),
      workout("2026-08-17T09:00:00Z", 1800, { type: "gym" }),
      workout("2026-08-18T09:00:00Z", 1800, { type: "gym" }),
      workout("2026-08-19T09:00:00Z", 600, { type: "gym" }),
    ]);

    expect(stats.typeBreakdown).toEqual([
      { type: "gym", count: 3, totalSeconds: 4200 },
      { type: "bike", count: 1, totalSeconds: 3600 },
    ]);
  });

  it("a igual número de entrenamientos ordena por tiempo", () => {
    const stats = statsFor([
      workout("2026-08-17T08:00:00Z", 600, { type: "running", gym_type: null }),
      workout("2026-08-18T08:00:00Z", 5400, { type: "walking", gym_type: null }),
    ]);

    expect(stats.typeBreakdown.map((entry) => entry.type)).toEqual([
      "walking",
      "running",
    ]);
  });

  it("sólo cuenta como gym los entrenamientos de gimnasio", () => {
    const stats = statsFor([
      workout("2026-08-17T08:00:00Z", 3600, { gym_type: "piernas" }),
      workout("2026-08-18T08:00:00Z", 3600, { gym_type: "piernas" }),
      workout("2026-08-19T08:00:00Z", 1200, { gym_type: "pecho" }),
      workout("2026-08-20T08:00:00Z", 1800, { type: "bike", gym_type: null }),
    ]);

    expect(stats.gymBreakdown).toEqual([
      { gymType: "piernas", count: 2, totalSeconds: 7200 },
      { gymType: "pecho", count: 1, totalSeconds: 1200 },
    ]);
  });
});

describe("entrenamiento más largo", () => {
  it("encuentra el récord de duración del periodo", () => {
    const stats = statsFor([
      workout("2026-08-17T08:00:00Z", 3600),
      workout("2026-08-18T08:00:00Z", 7500, { gym_type: "piernas" }),
      workout("2026-08-19T08:00:00Z", 1800),
    ]);

    expect(stats.longestWorkout?.duration_seconds).toBe(7500);
    expect(stats.longestWorkout?.gym_type).toBe("piernas");
  });

  it("ignora entrenamientos de duración cero", () => {
    expect(statsFor([workout("2026-08-17T08:00:00Z", 0)]).longestWorkout).toBeNull();
  });
});

describe("gráfica de actividad — semana", () => {
  it("dibuja siete barras de lunes a domingo", () => {
    const stats = statsFor([]);

    expect(stats.activity.granularity).toBe("day");
    expect(stats.activity.buckets).toHaveLength(7);
    expect(stats.activity.buckets.map((bucket) => bucket.label)).toEqual([
      "Lun",
      "Mar",
      "Mié",
      "Jue",
      "Vie",
      "Sáb",
      "Dom",
    ]);
  });

  it("coloca cada entrenamiento en su día local", () => {
    const stats = statsFor([
      // 22:30 UTC del domingo 16 = 00:30 del lunes 17 en Madrid.
      workout("2026-08-16T22:30:00Z", 3600),
      workout("2026-08-19T10:00:00Z", 1800), // miércoles
      workout("2026-08-19T17:00:00Z", 1800), // miércoles
    ]);

    const counts = stats.activity.buckets.map((bucket) => bucket.count);
    expect(counts).toEqual([1, 0, 2, 0, 0, 0, 0]);
    expect(stats.activity.maxCount).toBe(2);
    expect(stats.activity.buckets[2].totalSeconds).toBe(3600);
  });

  it("marca el día en curso", () => {
    const stats = statsFor([]);
    const current = stats.activity.buckets.filter((bucket) => bucket.isCurrent);

    expect(current).toHaveLength(1);
    expect(current[0].label).toBe("Lun");
  });
});

describe("gráfica de actividad — mes", () => {
  it("agrupa el mes en semanas recortadas al propio mes", () => {
    const stats = statsFor(
      [
        workout("2026-08-03T08:00:00Z", 3600),
        workout("2026-08-11T08:00:00Z", 3600),
        workout("2026-08-12T08:00:00Z", 3600),
      ],
      "month",
    );

    expect(stats.activity.granularity).toBe("week");
    // Agosto de 2026 empieza en sábado: 1-2, 3-9, 10-16, 17-23, 24-30, 31.
    expect(stats.activity.buckets.map((bucket) => bucket.label)).toEqual([
      "S1",
      "S2",
      "S3",
      "S4",
      "S5",
      "S6",
    ]);
    expect(stats.activity.buckets.map((bucket) => bucket.count)).toEqual([
      0, 1, 2, 0, 0, 0,
    ]);
  });

  it("las semanas cubren el mes entero sin huecos ni solapes", () => {
    // Un entrenamiento por cada día de agosto debe dar 31 en total.
    const everyDay = Array.from({ length: 31 }, (_, index) =>
      workout(
        `2026-08-${String(index + 1).padStart(2, "0")}T10:00:00Z`,
        600,
      ),
    );

    const stats = statsFor(everyDay, "month");
    const total = stats.activity.buckets.reduce(
      (sum, bucket) => sum + bucket.count,
      0,
    );

    expect(total).toBe(31);
  });
});

describe("gráfica de actividad — año y todo", () => {
  it("el año se reparte en doce meses", () => {
    const stats = statsFor(
      [
        workout("2026-01-15T10:00:00Z", 3600),
        workout("2026-08-17T10:00:00Z", 3600),
      ],
      "year",
    );

    expect(stats.activity.granularity).toBe("month");
    expect(stats.activity.buckets).toHaveLength(12);
    expect(stats.activity.buckets[0].label).toBe("Ene");
    expect(stats.activity.buckets[0].count).toBe(1);
    expect(stats.activity.buckets[7].count).toBe(1);
    expect(stats.activity.buckets[11].label).toBe("Dic");
  });

  it("'Todo' muestra los últimos doce meses y termina en el actual", () => {
    const stats = statsFor([], "all");

    expect(stats.activity.buckets).toHaveLength(12);
    expect(stats.activity.buckets[11].fullLabel).toBe("Ago 2026");
    expect(stats.activity.buckets[0].fullLabel).toBe("Sep 2025");
  });

  it("'Todo' sigue sumando los entrenamientos que caen fuera de la gráfica", () => {
    const stats = statsFor(
      [
        workout("2020-05-10T10:00:00Z", 3600), // muy anterior a la ventana
        workout("2026-08-17T10:00:00Z", 1800),
      ],
      "all",
    );

    // Los totales cuentan los dos…
    expect(stats.totalWorkouts).toBe(2);
    expect(stats.totalSeconds).toBe(5400);
    // …aunque la gráfica sólo pueda dibujar el que entra en los 12 meses.
    const charted = stats.activity.buckets.reduce(
      (sum, bucket) => sum + bucket.count,
      0,
    );
    expect(charted).toBe(1);
  });
});
