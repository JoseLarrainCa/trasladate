import { defineConfig } from "vitest/config";

// Pruebas del Worker (carpeta tests/): corren en Node puro, sin jsdom, con el SQL real
// de db/migrations sobre node:sqlite. Las de la interfaz siguen en vitest.config.ts.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
