import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const cmsApiPort = process.env.CMS_PORT || "4001";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../client/src"),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: `http://localhost:${cmsApiPort}`,
        changeOrigin: true,
      },
      "/images": {
        target: `http://localhost:${cmsApiPort}`,
        changeOrigin: true,
      },
    },
  },
  publicDir: path.resolve(__dirname, "../client/public"),
});
