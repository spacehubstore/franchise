// Лендинг франшизы SpaceHub: franchise.spacehubstore.com (GitHub Pages, ветка master, корень репозитория).
// Сборка – в _src/dist, затем ../build.sh переносит её в корень репозитория (Pages собирать не умеет, решение CMO 22.11.2026).
import { defineConfig } from "astro/config";
export default defineConfig({
  site: "https://franchise.spacehubstore.com",
  build: { format: "directory", assets: "assets/_astro" },
  trailingSlash: "always",
});
