import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // "server-only" throws outside Next's server bundle; it's a no-op in tests
      "server-only": path.resolve(__dirname, "tests/unit/stubs/empty.ts"),
    },
  },
  oxc: { jsx: { runtime: "automatic" } },
  test: { include: ["tests/unit/**/*.test.{ts,tsx}"], environment: "node" },
});
