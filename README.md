# deulli-web

영어 팟캐스트 학습 앱 **들리(deulli)**의 공식 웹사이트.

배포 주소: **https://deulli.com**

앱 소개와 **App Store·Google Play 다운로드**를 제공하는 단일 페이지다.

빌드는 Astro, 스타일은 Tailwind v4. `dionomy-landing`과 같은 구성이라 그쪽에서 만든
컴포넌트·설정을 그대로 가져다 쓸 수 있다.

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # dist/ 로 정적 빌드
pnpm preview      # 빌드 결과 확인
pnpm lint         # astro check + eslint
pnpm format       # prettier --write
pnpm og           # public/og-image.png 재생성
```

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

| 이름           | 없으면             |
| -------------- | ------------------ |
| `PUBLIC_GA_ID` | GA를 로드하지 않음 |

`PUBLIC_` 접두사가 붙은 값은 **빌드 시점에 클라이언트 번들로 인라인된다.** 배포 전에
등록되어 있어야 하고, 비밀값은 절대 넣으면 안 된다.

## 배포

Vercel에 정적 빌드로 올린다. `astro.config.mjs`의 `site`가 canonical·og:url·sitemap의
절대경로를 만들므로 도메인을 바꾸면 여기부터 고친다.

- 프레임워크 프리셋: Astro (자동 감지)
- 도메인: `deulli.com`
- 환경 변수: 위 표

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
