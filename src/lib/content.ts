import { getCollection, getEntry } from "astro:content";

/** 가이드를 허브·홈·관련 글에서 같은 순서로 보여준다. */
export async function getGuides() {
  const guides = await getCollection("guides");
  return guides.sort((a, b) => a.data.order - b.data.order);
}

export const guidePath = (id: string) => `/guides/${id}/`;

export async function getPage(id: string) {
  const entry = await getEntry("pages", id);
  if (!entry) throw new Error(`src/content/pages/${id}.md가 없습니다.`);
  return entry;
}
