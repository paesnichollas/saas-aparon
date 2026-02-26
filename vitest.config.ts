import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDirectory = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": rootDirectory,
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    passWithNoTests: false,
    setupFiles: ["tests/setup/vitest.setup.ts"],
  },
});
