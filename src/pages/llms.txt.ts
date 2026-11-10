/**
 * /llms.txt — AI 도구가 사이트를 한 번에 파악하도록 주는 요약과 주요 문서 목록.
 * 사이트 데이터와 콘텐츠 컬렉션에서 생성하므로 페이지를 추가하면 함께 갱신된다.
 */
import type { APIRoute } from "astro";
import { featuredEpisodes } from "../data/featured-episodes";
import { faq } from "../data/faq";
import { features, site, weekly } from "../data/site";
import { getGuides, getPage, guidePath } from "../lib/content";
import { abs } from "../lib/seo";

export const GET: APIRoute = async () => {
  const guides = await getGuides();
  const about = await getPage("about");
  const aboutEn = await getPage("about-en");

  const body = `# 들리 (deulli)

> ${site.description}

${site.descriptionEn}

- 플랫폼: iOS, Android
- App Store: ${site.stores.appStore}
- Google Play: ${site.stores.googlePlay}
- 공식 웹사이트: ${site.url}/
- 문의: ${site.email}

## 위클리 (중심 기능)

${weekly.lead}

${weekly.steps.map((step, index) => `${index + 1}. ${step.title}: ${step.body}`).join("\n")}

${weekly.note}

## 주요 기능

${features.map((feature) => `- ${feature.title}: ${feature.body}`).join("\n")}

요금, 구독 조건, 기기별 지원 버전은 앱과 각 스토어에 나옵니다.

## 제품 소개

- [${about.data.title}](${abs("/about/")}): ${about.data.description}
- [${aboutEn.data.title}](${abs("/en/about/")}): ${aboutEn.data.description}

## 학습 가이드

${guides.map((guide) => `- [${guide.data.title}](${abs(guidePath(guide.id))}): ${guide.data.description}`).join("\n")}

## 공식 팟캐스트

- [들리 공식 팟캐스트](${abs("/podcasts/")}): 들리 공식 채널의 공개 에피소드와 난이도 안내.
${featuredEpisodes.map((episode) => `- [${episode.title}](${abs(`/share/episode/${episode.id}`)}): ${episode.topic}, 앱 표시 난이도 ${episode.level}.`).join("\n")}

## 자주 묻는 질문

${faq.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n")}

## 지원·정책

- [고객지원](${site.policy.support})
- [개인정보 처리방침](${site.policy.privacy})
- [이용약관](${site.policy.terms})
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
