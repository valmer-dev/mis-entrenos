import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * La garantía crítica del modo demostración: que sea imposible que se cuelen
 * datos de ejemplo en una instalación con Supabase configurado.
 *
 * `isDemoMode` no tiene interruptor propio ni variable que lo active: depende
 * exclusivamente de que falte la configuración de Supabase. Este test fija ese
 * contrato para que nadie lo relaje más adelante sin darse cuenta.
 */

async function loadIsDemoMode(env: Record<string, string | undefined>) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", env.url ?? "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", env.anonKey ?? "");

  const { isDemoMode } = await import("./store");
  return isDemoMode;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("isDemoMode", () => {
  it("se activa cuando no hay configuración de Supabase", async () => {
    const isDemoMode = await loadIsDemoMode({});
    expect(isDemoMode()).toBe(true);
  });

  it("se apaga solo en cuanto Supabase está configurado", async () => {
    const isDemoMode = await loadIsDemoMode({
      url: "https://ejemplo.supabase.co",
      anonKey: "clave-anon",
    });
    expect(isDemoMode()).toBe(false);
  });

  it("sigue en demo si falta cualquiera de las dos variables", async () => {
    const soloUrl = await loadIsDemoMode({ url: "https://ejemplo.supabase.co" });
    expect(soloUrl()).toBe(true);

    const soloClave = await loadIsDemoMode({ anonKey: "clave-anon" });
    expect(soloClave()).toBe(true);
  });
});
