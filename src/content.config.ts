import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const dated = {
  title: z.string(),
  description: z.string(),
  /** 본문을 실제로 고친 날만 올린다. Article JSON-LD·사이트맵 lastmod·화면 표기가 이 값을 쓴다. */
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
};

/** /guides/{id}/ — 학습 가이드. order 순서로 허브와 홈에 나열한다. */
const guides = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/guides" }),
  schema: z.object({ ...dated, order: z.number() }),
});

/** 제품 소개처럼 주소가 고정된 단독 문서. 라우트는 src/pages에서 직접 연결한다. */
const pages = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/pages" }),
  schema: z.object({ ...dated, lang: z.enum(["ko", "en"]).default("ko") }),
});

export const collections = { guides, pages };
