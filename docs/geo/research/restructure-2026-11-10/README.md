# 구조 개편과 검색 제출 기록 · 2026-11-10

## 하락 여부 확인

"SEO가 떨어졌다"는 제보로 시작했지만 데이터에서 하락은 확인되지 않았다.

- Search Console(`https://deulli.com/` 속성, 2026-11-06 등록): 데이터는 11/4~11/8뿐이다. 일별 클릭 0·2·4·5·1, 노출 0·6·7·10·5, 평균 순위 1.3~2.0. 5일 합계 클릭 12, 노출 28.
- 검색어는 브랜드 "들리"(클릭 4, 노출 8, 순위 2.0)가 대부분이다. 비브랜드 노출은 사실상 없다.
- 색인 생성 8, 미생성 1(크롤링됨 - 현재 색인이 생성되지 않음). 직접 조치 없음.
- GA4(deulli-prod, 90일): Organic Search 세션 279. 그래프상 10월 말부터 완만히 증가했고 꺾인 구간은 없다. 일별 값은 표로 추출하지 않았다.
- title·canonical·robots.txt는 2026-09-30 이후 변경 이력이 없다.

결론: 내려간 것이 아니라 검색 노출 자체가 거의 없는 상태다.

## 이날 배포한 것

- PR #25: 공통 레이아웃, 가이드 허브, 404, `llms.txt`, 페이지별 JSON-LD, 숨김 애니메이션 제거, 히어로 높이 상한, 본문 문체 정리, 위클리 소개.
- PR #26: `/weekly/` 페이지, 네이버·Bing 소유 확인 메타 지원(`src/data/site.ts`의 `verification`).
- 측정 스크립트 지연: 일반 페이지에서 gtag.js와 fbevents.js를 `window.load` 이후에 내려받는다. 배포 전 Lighthouse 모바일(운영 홈): 성능 87, SEO 100, 접근성 100, LCP 4.0초. LCP 요소는 히어로 목업 이미지였다.

## 제출

- IndexNow: 페이지 10개와 에피소드 공유 3개 제출, HTTP 200. 네이버 IndexNow 엔드포인트에도 페이지 10개 제출, HTTP 200. 접수일 뿐 색인 완료가 아니다.
- Search Console: 사이트맵 재제출(제출일 11/10, 상태 성공). `/weekly/`, `/`, `/guides/`, `/about/` 색인 생성 요청 접수. `/weekly/`와 `/guides/`는 요청 시점에 "Google에 아직 알려지지 않은 URL"이었다.

## 하지 못한 것

- **네이버 서치어드바이저 등록**: 자동화 브라우저에서 네이버 접속이 막혀 있다. 공개 검색(`site:deulli.com`)에는 홈 1개만 보였다. 사람이 등록해야 한다(아래).
- **스토어 등록정보**: 로그인된 Google 계정에 Play Console 개발자 권한이 없었다. App Store Connect는 시도하지 않았다.

## 사람이 해야 할 일

1. 네이버 서치어드바이저(searchadvisor.naver.com) → 웹마스터 도구 → 사이트 등록 `https://deulli.com` → 소유 확인 "HTML 태그"의 `content` 값을 `src/data/site.ts`의 `verification.naver`에 넣고 배포 → 확인 후 요청 → 사이트맵 제출에 `https://deulli.com/sitemap-index.xml` 입력.
2. Play Console → 스토어 설정 → 연락처 세부정보의 웹사이트를 `https://deulli.com`으로 설정.
3. App Store Connect → 앱 정보의 마케팅 URL을 `https://deulli.com`으로 설정(다음 버전 제출 때 반영). 2026-11-10 공개 조회에서 `sellerUrl`은 비어 있었다.
4. 스토어 소개 글에 위클리를 넣는다. 2026-11-10 App Store 한국 소개(1.5.2)에는 "위클리"라는 단어가 없다. AI 답변이 스토어 소개를 주로 인용하므로 중심 기능이 빠져 있으면 답변에도 빠진다. 문안은 `../../content/store-metadata-patch.md`.

## 다음 확인

1~2주 뒤 Search Console에서 비브랜드 검색어 노출이 생기는지, `/weekly/`·`/guides/`가 색인됐는지 본다. 같은 질문 세트(`docs/geo/questions.json`)로 AI 답변을 다시 측정한다.
