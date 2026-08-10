// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // canonical·og:url·og:image·sitemap 절대경로가 이 값에서 생성된다.
  // 사전신청 기간에도 공식 페이지 전환 후에도 도메인은 deulli.com 그대로 간다.
  site: "https://deulli.com",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
