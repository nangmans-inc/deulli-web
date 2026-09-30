// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // canonical·og:url·og:image·sitemap 절대경로가 이 값에서 생성된다.
  site: "https://deulli.com",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
