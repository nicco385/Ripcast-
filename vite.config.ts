import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { APP_NAME } from "./src/config";

const manifest = () => JSON.stringify({
  name: `${APP_NAME} – fishing conditions`, short_name: APP_NAME, id: "./", start_url: "./", scope: "./", display: "standalone",
  background_color: "#06182b", theme_color: "#06182b",
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "icon-180.png", sizes: "180x180", type: "image/png" },
  ],
});
const appName = (): Plugin => ({
  name: "app-name",
  transformIndexHtml: (h) => h.replace(/%APP_NAME%/g, APP_NAME),
  generateBundle() { this.emitFile({ type: "asset", fileName: "manifest.webmanifest", source: manifest() }); },
  configureServer(s) { s.middlewares.use((req, res, next) => req.url?.endsWith("manifest.webmanifest") ? (res.setHeader("Content-Type", "application/manifest+json"), res.end(manifest())) : next()); },
});
export default defineConfig({
  base: process.env.GH_PAGES ? "/Ripcast-/" : "/",
  plugins: [react(), appName()],
  server: { allowedHosts: true },
  preview: { allowedHosts: true, port: 8081, host: "0.0.0.0" },
});
