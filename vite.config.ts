import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: process.env.GH_PAGES ? "/Ripcast-/" : "/",
  plugins: [react()],
  server: { allowedHosts: true },
  preview: { allowedHosts: true, port: 8081, host: "0.0.0.0" },
});
