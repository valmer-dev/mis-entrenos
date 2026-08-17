import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Sólo se testean las funciones puras: fechas y estadísticas. Son las que
    // pueden fallar en silencio (un entrenamiento contado en el día
    // equivocado no da ningún error, simplemente muestra un número mal).
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
