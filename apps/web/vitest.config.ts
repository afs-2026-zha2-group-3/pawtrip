import { fileURLToPath } from "node:url";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const srcRoot = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${srcRoot}/` },
      { find: /^#\//, replacement: `${srcRoot}/` },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
