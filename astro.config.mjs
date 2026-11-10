// @ts-check
import { readdirSync, readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { featuredEpisodes } from "./src/data/featured-episodes.ts";

const site = "https://deulli.com";

/**
 * 사이트맵 lastmod. 콘텐츠 프론트매터의 updatedAt을 그대로 쓴다.
 * 빌드 시각을 넣으면 배포할 때마다 모든 페이지가 "수정됨"이 되어 신호로서 가치가 없어진다.
 */
/** @param {string} file */
function updatedAt(file) {
  return readFileSync(file, "utf8").match(/^updatedAt:\s*(\S+)/m)?.[1];
}
/** @type {Map<string, string | undefined>} */
const lastmod = new Map([
  ["/about/", updatedAt("src/content/pages/about.md")],
  ["/en/about/", updatedAt("src/content/pages/about-en.md")],
]);
for (const name of readdirSync("src/content/guides")) {
  if (!name.endsWith(".md")) continue;
  lastmod.set(
    `/guides/${name.replace(/\.md$/, "")}/`,
    updatedAt(`src/content/guides/${name}`),
  );
}
// 홈·가이드 허브·공식 팟캐스트는 글과 함께 고치므로 가장 최근에 고친 글의 날짜를 따른다.
const latest = [...lastmod.values()].filter(Boolean).sort().at(-1);
lastmod.set("/", latest);
lastmod.set("/guides/", latest);
lastmod.set("/podcasts/", latest);

// https://astro.build/config
export default defineConfig({
  // canonical·og:url·og:image·sitemap 절대경로가 이 값에서 생성된다.
  site,
  output: "static",
  adapter: vercel(),
  integrations: [
    sitemap({
      // 공유 페이지는 SSR이라 자동 수집되지 않는다. 공개 확인한 에피소드만 직접 넣는다.
      customPages: featuredEpisodes.map(
        ({ id }) => `${site}/share/episode/${id}`,
      ),
      serialize(item) {
        const date = lastmod.get(new URL(item.url).pathname);
        return date ? { ...item, lastmod: date } : item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
