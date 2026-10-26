# deulli-web

영어 팟캐스트 학습 앱 **들리(deulli)**의 공식 웹사이트.

배포 주소: **https://deulli.com**

앱 소개·스토어 다운로드를 제공하는 정적 홈과 에피소드·쇼츠의 서버 렌더링 공유 페이지다.

빌드는 Astro, 스타일은 Tailwind v4. `dionomy-landing`과 같은 구성이라 그쪽에서 만든
컴포넌트·설정을 그대로 가져다 쓸 수 있다.

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # Vercel 정적 홈 + 공유 SSR 함수 (.vercel/output/)
pnpm test         # Node 22.18+ 계약·보안·캐시·브라우저 이동 테스트
pnpm test:http    # 로컬 mock API + 실제 Astro SSR HTTP 검증
pnpm test:http --built # build 후 Vercel 함수 직접 실행 + 정적 홈 산출물 검증
pnpm lint         # astro check + eslint
pnpm format       # prettier --write
pnpm og           # public/og-image.png 재생성
```

Node 22.18 이상과 pnpm을 사용한다. Vercel adapter는 Astro 5와 호환되는
`@astrojs/vercel@8.2.11`로 고정했다(peer `astro: ^5.0.0`, npm registry 확인).
Vercel adapter는 `astro preview`를 지원하지 않으므로 로컬 SSR 확인은 `pnpm dev`나
`pnpm test:http`를 사용한다. 빌드된 Vercel 함수는 `pnpm test:http --built`로 확인한다.

---

## 디자인 원본은 Figma다

색·서체·슬로건·마스코트·앱 스크린샷은 전부
[deulli Figma 파일](https://www.figma.com/design/kZeAdHPAC8JeBHAGE2D6p9/deulli)에서 가져왔다.
**여기서 새로 지어내지 않는다.** 바꿔야 하면 Figma를 먼저 고치고 이쪽에 반영한다.

| 이 저장소                         | Figma 원본                                            |
| --------------------------------- | ----------------------------------------------------- |
| `styles/global.css`의 `@theme`    | Deulli Color System / v1 (`89:2`)                     |
| 서체·타입 스케일                  | Deulli Design System · Typography (`103:2`)           |
| 슬로건 "듣다 보면 들리니까, 들리" | FINAL 1 · 슬로건 + 재생화면 목업 (`213:2`)            |
| 아이보리 + 네이비 + 블루 조합     | Feature Graphic · v2 안들리면들리 (`291:3`)           |
| `assets/mascot.png`               | deulli-mascot-hq-v5 (`170:3`)                         |
| `assets/hero-mockup.png`          | Perspective iPhone 17 Mockup · Semi Right (`2391:52`) |

### 목업을 받을 때 — export 말고 rawImages

현재 목업은 [Figma `2391:52`](https://www.figma.com/design/kZeAdHPAC8JeBHAGE2D6p9/deulli?node-id=2391-52)의
**Perspective iPhone 17 Mockup (Semi Right)**다. `download_assets` 응답의 **`rawImages` URL**로
받은 2458×4096 투명 PNG 원본을 수정 없이 저장한다. 웹에서는 `astro:assets`가 화면 크기에
맞는 WebP를 생성하므로 원본 PNG 전체를 브라우저에 보내지 않는다.

노드의 **export URL은 배경 채움까지 함께 그릴 수 있다.** 예전 `319:66` 목업은
`#f5f5f5` 배경 채움이 겹쳐 있어 export에 회색 판이 붙었고, 새 노드의 Figma 렌더에도
밝은 배경이 보인다. 페이지에는 배경이 투명한 원본 이미지 채움만 사용한다
(모서리 `0,0,0,0`).

목업이 흰 면에서 네모난 회색 판을 달고 있으면 두 가지를 순서대로 의심한다:

1. **떠 있는 옛 dev 서버.** 포트를 바꿔가며 띄우면 이전 서버가 계속 옛 이미지를 서빙한다.
   `lsof -nP -iTCP -sTCP:LISTEN | grep 432`로 확인하고 전부 죽인 뒤 하나만 띄운다.
2. 그래도 남으면 export URL로 받은 파일이다. `rawImages` 쪽으로 다시 받는다.

확인은 눈이 아니라 픽셀로 한다:

```bash
node -e "require('sharp')('src/assets/hero-mockup.png').ensureAlpha().raw()
  .toBuffer({resolveWithObject:true}).then(({data,info})=>
    console.log('모서리 알파', data[3], data[(info.width-1)*info.channels+3]))"
# 0 0  → 투명. 255면 회색 판이 붙어 있다.
```

제품을 글머리표로 설명하지 않고 **실제 플레이어 화면을 그대로 보여준다.** 문장이 어떻게
짚이는지는 기능 설명 세 줄보다 스크린샷 하나가 빠르다.

700px 이상에서는 왼쪽에 브랜드 카피와 다운로드 버튼, 오른쪽에 재생 화면 목업을 배치한다.
모바일에서는 슬로건 옆의 마스코트로 제품을 보여주고 다운로드 버튼을 첫 화면에 둔다.

## 구조

```
src/
  pages/index.astro           앱 다운로드 페이지
  pages/share/[kind]/[id].astro  에피소드·쇼츠 공유 SSR
  pages/share/og/[kind]/[id].ts   최신 서명 이미지 바이트 프록시
  lib/share.ts               익명 API 계약·ID 검증·이미지 보안·제한 캐시
  lib/share-service.ts       서버 환경 변수·로컬 폴백 이미지 연결
  scripts/share-redirect.js   공유 HTML에 포함되는 모바일 스토어 자동 이동
  layouts/BaseLayout.astro    <head> 메타·JSON-LD·스크롤 리빌
  components/
    Hero.astro                슬로건·마스코트·스크린샷·다운로드 버튼
    StoreLinks.astro          App Store·Google Play 다운로드 링크
    Analytics.astro           GA4 (PROD + 측정 ID 있을 때만)
    ui/                       Multiline
  data/
    site.ts                   도메인·브랜드 카피·스토어 주소·SEO 메타
  assets/
    mascot.png                마스코트 — astro:assets가 webp로 최적화
    hero-mockup.png           Figma 2391:52의 iPhone 17 목업 (배경 투명)
  styles/global.css           디자인 토큰 2계층 + base/components 레이어
public/
  logo.svg, favicon.svg       로고 (deulli-policy와 동일 파일)
  og-image.png                1200×630 공유 카드 — scripts/generate-og.mjs 산출물
  fonts/pretendard/           자체 호스팅 Pretendard (가변·동적 서브셋)
```

### 색

파랑 `#0150e5`, 네이비 `#082142`, 아이보리 `#fbf0e6`. 컴포넌트에서는 원시
팔레트(`--color-blue-*`)를 직접 쓰지 말고 의미 역할(`--color-brand`, `--color-fg` …)만
참조한다.

### 스토어 버튼

브랜드 카피 아래에 App Store·Google Play 다운로드 버튼을 둔다. 주소는 `src/data/site.ts`의
`stores`에서 관리한다. 한국어 공식 배지를 `public/badges/`에 저장해 외부 이미지 서버에
의존하지 않으며, App Store를 먼저 배치하고 두 배지의 보이는 높이를 48px로 맞춘다.
좁은 화면에서는 줄바꿈하고, 각 링크의 터치 영역은 최소 48px 높이로 둔다.

배지는 [Apple 공식 배지 API](https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/ko-kr?size=250x83)와
[Google Play 공식 한국어 배지](https://play.google.com/intl/en_us/badges/static/images/badges/ko_badge_web_generic.png) 원본을 수정 없이 사용한다.
기존 들리 팔레트와 Pretendard를 사용하고, 스토어를 즉시 식별할 수 있는 검정 배지를 주요
액션으로 배치한다. 버튼 자체의 디자인 기준은 ENERGY 1 / RHYTHM 1 / MOTION 1이며,
별도의 애니메이션을 넣지 않는다.

## 환경 변수

`.env.example`을 `.env`로 복사해서 채운다. Vercel에도 같은 이름으로 등록한다.

| 이름           | 없으면                            |
| -------------- | --------------------------------- |
| `PUBLIC_GA_ID` | GA를 로드하지 않음                |
| `API_BASE`     | `https://api.deulli.nangmans.com` |

`PUBLIC_` 접두사가 붙은 값은 **빌드 시점에 클라이언트 번들로 인라인된다.** 배포 전에
등록되어 있어야 하고, 비밀값은 절대 넣으면 안 된다.

`API_BASE`는 **서버 전용**이며 `PUBLIC_` 접두사를 붙이지 않는다. Vercel 런타임의
`process.env.API_BASE`를 우선하고 로컬 `.env` 값을 지원한다. HTTPS API URL을 사용하며,
로컬 테스트에서는 `http://127.0.0.1:포트` 또는 `http://localhost:포트`도 허용한다.
인증 헤더·사용자 쿠키를 API에 전달하지 않는다. URL에 자격증명·쿼리·fragment를 넣지 않는다.

## 공개 공유 페이지

- `https://deulli.com/share/episode/{id}` → 익명 `GET {API_BASE}/podcasts/{id}`.
  응답의 `id`, `name`, `description`, `thumbnail_url`을 사용한다.
- `https://deulli.com/share/shorts/{id}` → 익명 `GET {API_BASE}/shorts/{id}/share`.
  응답은 `id`, `title`, `summary`, `podcast_id`, `podcast_name`, `thumbnail_url`이며
  `summary`·`thumbnail_url`은 `null`을 허용한다.

ID는 선행 0 없는 양의 JavaScript safe integer다. 잘못된 경로·없는/비공개 콘텐츠는 404,
타임아웃·5xx·잘못된 응답은 503이며 오류 응답은 모두 `Cache-Control: no-store`다.
백엔드 401/403/404/410은 공개 접근 불가로 처리한다. 형식 오류를 웹에서 미리 거르므로
정상 ID에 대한 백엔드 422는 계약 오류(503)로 처리한다.

OG/Twitter 태그는 JavaScript 실행 전 HTML에 포함되고 canonical은 요청 호스트·쿼리와
관계없이 `https://deulli.com/share/...`다. 동적 콘텐츠는 Astro의 기본 escaping으로 출력한다.
설치 앱은 OS의 Universal/App Links 연결이 유효할 때 웹에 도달하기 전에 열린다.
정상 공유 HTML을 모바일 브라우저에서 열면 iOS는 App Store, Android는 Google Play로
`location.replace`한다. 스토어 주소는 `src/data/site.ts`의 기존 `stores`를 사용하며,
iPad의 데스크톱 UA도 `MacIntel`·멀티터치로 판별한다. 설치 여부를 추측하는 타이머나
자동 커스텀 scheme 호출은 사용하지 않는다. Android의 verified App Links는 아래 전제가
아직 충족되지 않아 동작이 검증되지 않았다.

큰 아트워크·콘텐츠 소개 화면은 제거하고 `deulli://app/episode/{id}` 또는
`deulli://app/shorts/{id}`의 수동 앱 열기와 두 스토어의 작은 텍스트 링크만 남긴다.
자동 이동이 차단되거나 JavaScript가 꺼져 있어도 이 링크를 사용할 수 있다.
데스크톱·알 수 없는 플랫폼·알려진 봇/미리보기 crawler는 자동 이동하지 않는다.
백그라운드/사전 렌더링 문서는 활성화되고 화면에 보일 때 한 번만 이동을 시도하며,
404/503 오류 페이지에는 자동 이동 코드를 포함하지 않는다. 서버 302나 meta refresh를
사용하지 않으므로 최초 응답의 OG/Twitter HTML은 유지된다.

공유 이미지 주소는 `/share/og/episode/{id}`·`/share/og/shorts/{id}`로 고정된다.
서명 URL은 HTML·리다이렉트·응답 헤더에 노출하지 않는다. 프록시는 매 요청마다 공개
메타데이터를 새로 받고 최신 서명 URL로 이미지를 내려받아 바이트를 반환한다.

이미지는 HTTPS의 **정확한 호스트 `d19hzt4ehho5l3.cloudfront.net`만** 허용한다.
2026-10-25 운영 익명 `GET /podcasts/105948` 응답의 `thumbnail_url`에서 이 호스트와
`/images/channels/3.jpg` 경로를 확인했다(서명 쿼리 값은 저장하지 않음).
다른 CloudFront 배포·임의 호스트·포트·자격증명은 허용하지 않으며 모든 upstream
리다이렉트를 거부한다. CDN 변경 시 실제 메타데이터와 소유권을 확인하고 코드의
`IMAGE_HOSTS`를 변경해야 한다. 클라이언트가 보낸 이미지 URL은 사용하지 않는다.

메타데이터는 128 KiB, 이미지는 5 MiB까지 스트림으로 읽고 각 요청 전체에 5초 제한을 둔다.
PNG/JPEG/WebP/GIF의 Content-Type과 파일 시그니처를 함께 검사하며 SVG는 허용하지 않는다.
이미지가 없거나 안전하게 읽을 수 없으면 서버에 번들된 `public/og-image.png`를 반환한다.
정상 이미지는 브라우저 60초·공유 CDN 300초, HTML은 공유 CDN 60초까지 캐시한다.
따라서 공개 해제 직후 기존 CDN 응답이 남을 수 있는 상한은 각각 5분·1분이다.

서버 메모리에는 성공한 이미지 바이트만 최대 32개/16 MiB/5분 보관한다. **새 메타데이터가
여전히 공개이며 같은 허용 호스트·이미지 경로인 경우에만**, 이미지 다운로드 실패 시
이 캐시를 폴백으로 사용한다. 메타데이터 오류/비공개 또는 이미지 경로 변경에는 기존
캐시를 사용하지 않는다. 일시적 실패의 캐시·로컬 이미지 폴백은 `no-store`이며 메타데이터
장애 시 로컬 이미지 응답도 503이다. 이 캐시는 서버 인스턴스별이며 지속성을 보장하지 않는다.

## 배포

Vercel에 정적 홈과 SSR 함수를 함께 올린다. `output: "static"`을 유지하고 공유 페이지와
이미지 경로만 `prerender = false`다. `astro.config.mjs`의 `site`가 홈의 canonical·og:url·sitemap의
절대경로를 만들므로 도메인을 바꾸면 여기부터 고친다.

- 프레임워크 프리셋: Astro (자동 감지)
- 도메인: `deulli.com`
- 환경 변수: 위 표
- Node 런타임: 22.x. 빌드: `pnpm build`, 기존 정적 전용 output override가 있으면 제거한다.
- `.vercel/output/`의 정적 홈과 `_render` 함수를 함께 배포한다. `dist/`만 업로드하면 공유가 동작하지 않는다.
- 서버 함수에서 API와 위 CloudFront 호스트로 HTTPS 접근이 가능해야 한다.

### 앱 링크 연결 전제

`public/.well-known/apple-app-site-association`은
`GT75SU9T79.com.deulli.app`의 `/share/episode/*`·`/share/shorts/*`만 연결한다.
근거는 형제 앱 저장소 `ios/Flutter/Signing.xcconfig`의 `DEVELOPMENT_TEAM = GT75SU9T79`와
`ios/Runner.xcodeproj/project.pbxproj`의 `PRODUCT_BUNDLE_IDENTIFIER = com.deulli.app`다.
개인 로컬 signing override를 사용하는 앱은 이 운영 association 대상이 아니다.
Vercel 헤더는 이 확장자 없는 파일을 `application/json`으로 제공한다.

실제 iOS Universal Links 동작에는 운영 도메인 HTTPS, 인증·리다이렉트 없는 AASA 200 응답,
배포 앱의 `applinks:deulli.com` entitlement·프로비저닝, HTTPS `/share/...` 수신 구현과
실기기 검증이 필요하다. 앱 수신 구현은 `deulli-app`에서 담당한다. AASA를 올리는 것만으로
기존 설치 앱이 즉시 연결되는 것은 아니며 Apple의 association 캐시도 확인해야 한다.

Android는 **Play App Signing SHA-256 인증서 지문이 아직 확인되지 않아**
`assetlinks.json`을 생성하지 않았다. 운영 Play Console의 앱 서명 인증서 SHA-256을 확보한 뒤
패키지 `com.deulli.app`에 대한 `delegate_permission/common.handle_all_urls` association을
`/.well-known/assetlinks.json`에 추가하고 앱의 HTTPS intent filter·autoVerify와 실기기
검증을 완료해야 한다. 업로드 키·디버그 키 지문으로 대신하지 않는다.

2026-10-26 인계된 검증 기록 기준 웹 PR #6 (`c7e004a`)와 백엔드 운영 PR #382의
배포 실행 `40205745549`는 성공했다. iOS 17 시뮬레이터에서 Universal Link의 warm/cold
실행과 네이티브 Share의 Copy(쇼츠 `8349`·에피소드 `105948`)를 확인했다.
이 자동 이동 변경은 아직 배포하지 않았고, 실기기·실제 메신저 미리보기·Android verified
association은 미검증이다. 상세 검증 범위는 [docs/share-verification.md](docs/share-verification.md)에 기록한다.

## 측정

GA4와 Meta Pixel은 프로덕션 빌드에서만 로드된다. GA4는 페이지 조회와 `home` 섹션 노출을,
Meta Pixel은 `PageView`를 기록한다. 로컬 개발 서버에서는 둘 다 로드되지 않는다.

## 과거 운영 기록

`apps-script/`와 [docs/apps-script-form.md](docs/apps-script-form.md)는 이전 폼의 코드와
수집 항목·시트 설정을 확인하기 위한 보관 자료다. 현재 웹페이지에서는 호출하지 않는다.
기존 개인정보의 보관·파기 이력을 확인할 수 있도록 이 자료는 유지한다.

## 관련 저장소

|                                         |                                    |
| --------------------------------------- | ---------------------------------- |
| [deulli-app](../deulli-app)             | Flutter 앱                         |
| [deulli-backend](../deulli-backend)     | FastAPI 백엔드                     |
| [deulli-admin-web](../deulli-admin-web) | 운영 어드민 (Vite + React)         |
| [deulli-policy](../deulli-policy)       | 약관·개인정보·고객지원 정적 사이트 |
