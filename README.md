# deulli-web

영어 팟캐스트 학습 앱 **들리(deulli)**의 공식 웹사이트.

배포 주소 — **https://deulli.com**

지금은 **사전신청 페이지 한 장**이다. 출시하면 같은 저장소에서 공식 홈페이지로 갈아끼운다.
(→ [공식 페이지로 전환](#공식-페이지로-전환))

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

## 왜 사전신청 페이지가 필요한가

앱을 만드는 동안 **출시 시점에 연락할 수 있는 사람 명단**을 모은다. 출시일에 문자를 한 통
보내는 것이 전부라 받는 정보도 전화번호 하나뿐이다.

받는 항목을 늘릴수록 전환율은 떨어진다. 이름·이메일·관심분야를 묻고 싶은 유혹이 있지만,
출시 알림에 필요한 건 번호 하나다. 필드를 추가하려면 **그 데이터로 무엇을 할지부터**
정하고 개인정보 처리방침의 수집 항목도 같이 고쳐야 한다.

## 구조

```
src/
  pages/index.astro           사전신청 페이지 (전환 시 여기를 갈아끼운다)
  layouts/BaseLayout.astro    <head> 메타·JSON-LD·스크롤 리빌
  components/
    Prelaunch.astro           사전신청 카드 레이아웃·카피  ┐ 전환 시
    SignupForm.astro          전화번호 폼·검증·전송        ┘ 통째로 삭제
    Analytics.astro           GA4 (PROD + 측정 ID 있을 때만)
    ui/                       CheckIcon, Multiline
  data/
    site.ts                   도메인·브랜드·SEO 메타 (계속 쓴다)
    prelaunch.ts              사전신청 카피         (전환 시 삭제)
  styles/global.css           디자인 토큰 2계층 + base/components 레이어
public/
  logo.svg, favicon.svg       로고 (deulli-policy와 동일 파일)
  og-image.png                1200×630 공유 카드 — scripts/generate-og.mjs 산출물
  fonts/pretendard/           자체 호스팅 Pretendard (가변·동적 서브셋)
apps-script/Code.gs           폼 백엔드 — 시트에 적재 + 메일 알림
docs/apps-script-form.md      시트·Apps Script 설정 절차
```

### 색

`logo.svg`에서 뽑았다 — 파랑 `#0150e5`, 네이비 `#082142`, 크림 `#fbf0e6`. `deulli-policy`의
CSS 변수와 같은 값이므로 두 사이트를 오가도 색이 어긋나지 않는다. 컴포넌트에서는 원시
팔레트(`--color-primary-*`)를 직접 쓰지 말고 의미 역할(`--color-brand`, `--color-fg` …)만
참조한다.

## 폼은 어디로 가는가

브라우저 → Apps Script 웹 앱 → Google Sheet. 서버가 없다.

설정 절차와 코드는 [docs/apps-script-form.md](docs/apps-script-form.md)에 있다. 기존
`dionomy-landing` 시트를 재활용할지 새로 팔지도 거기서 정한다. payload에 `form: "deulli"`가
실려 가고 스크립트가 그 값으로 탭을 고르므로, 어느 쪽을 택해도 클라이언트 코드는 같다.

`PUBLIC_FORM_ENDPOINT`가 비어 있으면 폼은 콘솔에 payload만 찍고 성공 화면으로 넘어간다.
로컬 개발 중에는 비워 두면 된다.

### 중복 신청

같은 브라우저는 `localStorage`(`deulli:applied`)로 막고, 같은 번호는 Apps Script가 시트를
훑어 막는다. 둘 다 사용자에게는 완료 화면을 보여준다 — "이미 신청하셨습니다"는 알려줄
가치가 없고, 번호가 시트에 있는지를 외부에 노출하는 셈이라 좋지도 않다.

## 환경 변수

`.env.example`을 `.env`로 복사해서 채운다. Vercel에도 같은 이름으로 등록한다.

| 이름                   | 없으면                       |
| ---------------------- | ---------------------------- |
| `PUBLIC_FORM_ENDPOINT` | 폼이 전송하지 않고 콘솔 스텁 |
| `PUBLIC_GA_ID`         | GA를 로드하지 않음           |

`PUBLIC_` 접두사가 붙은 값은 **빌드 시점에 클라이언트 번들로 인라인된다.** 배포 전에
등록되어 있어야 하고, 비밀값은 절대 넣으면 안 된다.

## 배포

Vercel에 정적 빌드로 올린다. `astro.config.mjs`의 `site`가 canonical·og:url·sitemap의
절대경로를 만들므로 도메인을 바꾸면 여기부터 고친다.

- 프레임워크 프리셋: Astro (자동 감지)
- 도메인: `deulli.com`
- 환경 변수: 위 표

## 측정

GA4는 프로덕션 빌드에서만 로드된다(dev 트래픽 오염 방지). 폼 퍼널은 이렇게 찍힌다.

| 이벤트                                     | 시점                       |
| ------------------------------------------ | -------------------------- |
| `signup_form_start`                        | 폼에 첫 입력               |
| `signup_submit`                            | 제출 버튼 클릭(검증 전)    |
| `signup_invalid` (`reason: phone,consent`) | 검증 실패 — 마찰 지점 파악 |
| `generate_lead`                            | 신청 완료                  |
| `signup_error`                             | 전송 실패                  |

`signup_submit` 대비 `generate_lead` 비율이 낮으면 검증에서 막히고 있다는 뜻이고,
`signup_invalid`의 `reason`이 어디인지 알려준다.

## 공식 페이지로 전환

사전신청이 끝나면:

1. `src/pages/index.astro`의 내용을 공식 홈으로 교체
2. `components/Prelaunch.astro`, `components/SignupForm.astro`, `data/prelaunch.ts` 삭제
3. `src/env.d.ts`에서 `PUBLIC_FORM_ENDPOINT` 항목 제거, Vercel 환경 변수도 삭제
4. `apps-script/`, `docs/apps-script-form.md`는 남겨 둔다 — 시트에 남은 개인정보를 파기할
   때까지 무엇을 어떻게 받았는지가 기록으로 필요하다
5. `data/site.ts`의 `description`·`keywords`·`ogImage`를 제품 소개용으로 갱신하고 `pnpm og`
6. 신청자에게 출시 문자를 보낸 뒤 시트의 전화번호 열을 파기 (개인정보 처리방침에 적은 대로)

`data/site.ts`, `layouts/BaseLayout.astro`, `styles/global.css`, `public/fonts`는 그대로 쓴다.

## 관련 저장소

|                                         |                                    |
| --------------------------------------- | ---------------------------------- |
| [deulli-app](../deulli-app)             | Flutter 앱                         |
| [deulli-backend](../deulli-backend)     | FastAPI 백엔드                     |
| [deulli-admin-web](../deulli-admin-web) | 운영 어드민 (Vite + React)         |
| [deulli-policy](../deulli-policy)       | 약관·개인정보·고객지원 정적 사이트 |
