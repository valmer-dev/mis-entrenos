import { describe, expect, it } from "vitest";

import {
  addCivilDays,
  addCivilMonths,
  civilDateKey,
  civilDaysBetween,
  civilWeekday,
  civilToInstant,
  isValidTimeZone,
  startOfCivilDay,
  startOfCivilWeek,
  toCivilDate,
  toCivilDateTime,
} from "./civil";
import { formatDuration, formatRelativeDay, formatStopwatch } from "./format";

const MADRID = "Europe/Madrid";

describe("toCivilDate", () => {
  it("usa el calendario local, no el del servidor", () => {
    // 22:30 UTC del 16 de agosto son las 00:30 del 17 en Madrid (UTC+2).
    // Éste es exactamente el fallo que se evita: en UTC el entrenamiento
    // caería en el día anterior.
    const instant = new Date("2026-08-16T22:30:00Z");

    expect(toCivilDate(instant, MADRID)).toEqual({
      year: 2026,
      month: 8,
      day: 17,
    });
    expect(toCivilDate(instant, "UTC")).toEqual({
      year: 2026,
      month: 8,
      day: 16,
    });
  });

  it("devuelve la medianoche como hora 0 y no como 24", () => {
    const instant = new Date("2026-08-16T22:00:00Z"); // 00:00 del 17 en Madrid
    expect(toCivilDateTime(instant, MADRID).hour).toBe(0);
  });
});

describe("startOfCivilDay", () => {
  it("resuelve el inicio del día en horario de verano", () => {
    // En agosto Madrid va en UTC+2, así que la medianoche local son las 22:00
    // UTC del día anterior.
    const start = startOfCivilDay({ year: 2026, month: 8, day: 17 }, MADRID);
    expect(start.toISOString()).toBe("2026-08-16T22:00:00.000Z");
  });

  it("resuelve el inicio del día en horario de invierno", () => {
    // En enero Madrid va en UTC+1.
    const start = startOfCivilDay({ year: 2026, month: 1, day: 15 }, MADRID);
    expect(start.toISOString()).toBe("2026-01-14T23:00:00.000Z");
  });

  it("acierta el día del cambio de hora de primavera", () => {
    // El 29 de marzo de 2026 los relojes saltan de las 02:00 a las 03:00.
    // La medianoche de ese día todavía es UTC+1.
    const start = startOfCivilDay({ year: 2026, month: 3, day: 29 }, MADRID);
    expect(start.toISOString()).toBe("2026-03-28T23:00:00.000Z");

    // Y el día siguiente ya es UTC+2.
    const next = startOfCivilDay({ year: 2026, month: 3, day: 30 }, MADRID);
    expect(next.toISOString()).toBe("2026-03-29T22:00:00.000Z");
  });

  it("acierta el día del cambio de hora de otoño", () => {
    // El 25 de octubre de 2026 los relojes retrasan de las 03:00 a las 02:00.
    const start = startOfCivilDay({ year: 2026, month: 10, day: 25 }, MADRID);
    expect(start.toISOString()).toBe("2026-10-24T22:00:00.000Z");

    const next = startOfCivilDay({ year: 2026, month: 10, day: 26 }, MADRID);
    expect(next.toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });

  it("un día de cambio de hora sigue durando un día de calendario", () => {
    const start = startOfCivilDay({ year: 2026, month: 3, day: 29 }, MADRID);
    const end = startOfCivilDay({ year: 2026, month: 3, day: 30 }, MADRID);
    // 23 horas reales, pero un solo día del calendario.
    expect(end.getTime() - start.getTime()).toBe(23 * 3600 * 1000);
  });
});

describe("civilToInstant", () => {
  it("es la inversa de toCivilDateTime", () => {
    const original = new Date("2026-11-03T18:45:12Z");
    const civil = toCivilDateTime(original, MADRID);
    expect(civilToInstant(civil, MADRID).toISOString()).toBe(
      "2026-11-03T18:45:12.000Z",
    );
  });
});

describe("aritmética de calendario", () => {
  it("suma días cruzando meses y años", () => {
    expect(addCivilDays({ year: 2026, month: 8, day: 31 }, 1)).toEqual({
      year: 2026,
      month: 9,
      day: 1,
    });
    expect(addCivilDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({
      year: 2027,
      month: 1,
      day: 1,
    });
    expect(addCivilDays({ year: 2026, month: 1, day: 1 }, -1)).toEqual({
      year: 2025,
      month: 12,
      day: 31,
    });
  });

  it("suma meses colocándose en el día 1", () => {
    expect(addCivilMonths({ year: 2026, month: 12, day: 17 }, 1)).toEqual({
      year: 2027,
      month: 1,
      day: 1,
    });
    expect(addCivilMonths({ year: 2026, month: 1, day: 5 }, -11)).toEqual({
      year: 2025,
      month: 2,
      day: 1,
    });
  });

  it("cuenta la semana empezando en lunes", () => {
    // 17/08/2026 es lunes.
    expect(civilWeekday({ year: 2026, month: 8, day: 17 })).toBe(0);
    // 23/08/2026 es domingo, el último día de esa semana.
    expect(civilWeekday({ year: 2026, month: 8, day: 23 })).toBe(6);
  });

  it("el domingo pertenece a la semana que empezó el lunes anterior", () => {
    expect(startOfCivilWeek({ year: 2026, month: 8, day: 23 })).toEqual({
      year: 2026,
      month: 8,
      day: 17,
    });
  });

  it("cuenta los días entre fechas", () => {
    expect(
      civilDaysBetween(
        { year: 2026, month: 8, day: 17 },
        { year: 2026, month: 8, day: 24 },
      ),
    ).toBe(7);
    expect(
      civilDaysBetween(
        { year: 2026, month: 3, day: 28 },
        { year: 2026, month: 3, day: 30 },
      ),
      // Aunque uno de esos días sólo tenga 23 horas reales.
    ).toBe(2);
  });

  it("genera claves ordenables", () => {
    expect(civilDateKey({ year: 2026, month: 8, day: 7 })).toBe("2026-08-07");
  });
});

describe("isValidTimeZone", () => {
  it("acepta zonas IANA y rechaza basura", () => {
    expect(isValidTimeZone(MADRID)).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("No/Existe")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });
});

describe("formatDuration", () => {
  it("formatea como se lee en las tarjetas", () => {
    expect(formatDuration(0)).toBe("0min");
    expect(formatDuration(30)).toBe("<1min");
    expect(formatDuration(45 * 60)).toBe("45min");
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(4354)).toBe("1h 12min");
    expect(formatDuration(67_320)).toBe("18h 42min");
    expect(formatDuration(null)).toBe("—");
  });
});

describe("formatStopwatch", () => {
  it("siempre usa dos dígitos por campo", () => {
    expect(formatStopwatch(0)).toBe("00:00:00");
    expect(formatStopwatch(4354)).toBe("01:12:34");
    expect(formatStopwatch(-5)).toBe("00:00:00");
  });
});

describe("formatRelativeDay", () => {
  const now = new Date("2026-08-17T18:00:00Z");

  it("distingue hoy, ayer y fechas anteriores", () => {
    expect(formatRelativeDay(new Date("2026-08-17T08:00:00Z"), now, MADRID)).toBe(
      "Hoy",
    );
    expect(formatRelativeDay(new Date("2026-08-16T08:00:00Z"), now, MADRID)).toBe(
      "Ayer",
    );
    expect(formatRelativeDay(new Date("2026-08-12T08:00:00Z"), now, MADRID)).toBe(
      "12 Ago",
    );
  });

  it("añade el año cuando no es el actual", () => {
    expect(formatRelativeDay(new Date("2025-11-02T08:00:00Z"), now, MADRID)).toBe(
      "2 Nov 2025",
    );
  });

  it("un entrenamiento de madrugada sigue siendo 'hoy'", () => {
    // 22:30 UTC del 16 = 00:30 del 17 en Madrid.
    expect(formatRelativeDay(new Date("2026-08-16T22:30:00Z"), now, MADRID)).toBe(
      "Hoy",
    );
  });
});
