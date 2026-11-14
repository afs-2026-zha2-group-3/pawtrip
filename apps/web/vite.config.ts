import { defineConfig } from "vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    proxy: {
      "/api": process.env.PAWTRIP_API_PROXY_TARGET ?? "http://localhost:8080",
    },
  },
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
});

export default config;
