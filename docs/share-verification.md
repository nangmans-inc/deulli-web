# 공개 공유 링크 구현·검증 기록

- 날짜: 2026-10-26
- 기준: 웹 PR #6이 배포된 main `c7e004a`, 작업 브랜치 `fix/share-auto-redirect`.
- 범위: 웹 공유 화면 최소화·모바일 스토어 자동 이동·테스트·문서 수정. 이번 변경은 배포하지 않았다.
- 아래 운영·시뮬레이터 결과는 이번 작업에 인계된 검증 기록이며, 이번 실행에서 재검증하지 않았다.

## 현재 공유 흐름

1. `/share/episode/{id}`·`/share/shorts/{id}`를 누르면 설치 앱은 OS의 유효한
   Universal/App Links 연결을 통해 웹에 도달하기 전에 열린다. Android verified
   association은 아직 미구성이므로 Android에서 이 동작을 보장하지 않는다.
2. 웹에 도달한 정상 공유 응답은 200 SSR HTML에 escaped OG/Twitter 메타,
   고정 `https://deulli.com` canonical, 서명 쿼리 없는 `/share/og/{kind}/{id}`를 포함한다.
   기존 익명 API 계약·이미지 프록시·캐시·오류 상태는 유지한다.
3. HTML의 작은 스크립트가 iPhone/iPod/iPad를 App Store로, Android를 Google Play로
   `location.replace`한다. iPad 데스크톱 UA는 `MacIntel`·`maxTouchPoints > 1`로 구분한다.
   주소는 `site.stores`에서 전달하며 서버 302·meta refresh·설치 감지 타이머·자동 scheme
   호출을 사용하지 않는다.
4. 알려진 크롤러/미리보기 UA, 데스크톱, 알 수 없는 플랫폼은 자동 이동하지 않는다.
   백그라운드·사전 렌더링 문서는 활성화되고 보이는 상태가 된 뒤 한 번만 이동을 시도한다.
5. 큰 아트워크·콘텐츠 소개 UI를 제거하고 접근 가능한 앱 열기·App Store·Google Play
   텍스트 링크를 남긴다. JavaScript 비활성·자동 이동 차단 시에도 수동 링크를 사용할 수 있다.
   앱 열기는 기존 `deulli://app/{kind}/{id}`를 사용한다.
6. 잘못된 ID·없는/비공개 콘텐츠는 404, upstream 장애·계약 오류는 503 오류 페이지를
   유지한다. 오류 HTML에는 자동 이동 코드나 대상 표시를 넣지 않고 `no-store`를 유지한다.

스크립트는 `src/scripts/share-redirect.js`에 격리하고 성공 HTML에 그대로 포함한다.
Node `vm`으로 원본과 실제 개발/빌드 SSR HTML에 실린 코드를 실행하므로 브라우저 연결까지
검증한다. 초기 HTML의 수동 링크와 메타는 JavaScript 실행에 의존하지 않는다.

## 기존 운영·앱 검증 상태

- 웹 PR #6 (`c7e004a`)은 운영 배포되었다. 기존 문서의 웹 미배포 표기는 갱신했다.
- 백엔드 PR #382의 운영 배포 실행 `40205745549`는 성공했다. Shorts 공개 API가
  아직 배포되지 않았다는 기존 표기는 제거했다.
- iOS 17 시뮬레이터에서 Universal Link의 warm/cold 실행을 확인했다.
- 쇼츠 `8349`·에피소드 `105948`의 네이티브 Share → Copy를 확인했다.
- iOS AASA 대상은 `GT75SU9T79.com.deulli.app`, 경로는 `/share/episode/*`·`/share/shorts/*`다.
  운영 도메인·앱 entitlement/프로비저닝·OS association 캐시가 연결의 전제다.
- Play App Signing SHA-256은 아직 없으며 `assetlinks.json`도 생성하지 않았다.
  Android verified App Links는 미검증이다.

## 이번 로컬 검증 결과

Node `v22.22.0`, pnpm `10.17.0`을 사용했고 추가 의존성을 설치하지 않았다.

| 검증                                   | 결과                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm test`                            | 40/40 통과: 기존 계약·보안·캐시 30개와 모바일/데스크톱/iPad/크롤러/배경/사전 렌더링/차단/오류 리다이렉트 10개                  |
| `pnpm lint`                            | Astro 0 errors/warnings/hints, ESLint 통과                                                                                     |
| `pnpm build`                           | 정적 홈과 Vercel SSR 함수 생성 통과                                                                                            |
| `pnpm test:http`                       | 개발 SSR HTTP 통과: OG/Twitter/escaping/canonical·수동 링크·본문 이미지 제거·실제 실린 스크립트 실행·PNG·404/503/no-store·AASA |
| `pnpm test:http --built`               | 빌드된 Vercel 함수에서 같은 HTTP/스크립트 검증 통과, 정적 홈·SSR 라우팅 산출물 확인                                            |
| 변경 파일 Prettier, `git diff --check` | 통과                                                                                                                           |

리다이렉트 테스트는 iOS/Android/데스크톱/iPad와 모바일 UA를 가진 주요 crawler를 구분하고,
백그라운드에서의 대기·prerender 활성화 순서·일회성 이동·이동 차단 예외를 확인한다.
HTTP 테스트는 episode와 shorts 각각의 성공 HTML에서 실제 코드를 추출해 실행하고,
양쪽 404/503 HTML에 리다이렉트가 없으며 상태·오류 메시지·재시도 링크가 유지되는지 확인한다.

## 이미지 계약·보안 근거

- 기존 익명 API 계약과 `/share/og/{episode|shorts}/{id}` 바이트 프록시는 변경하지 않았다.
- 2026-10-25 운영 익명 `GET /podcasts/105948`에서 이미지 호스트
  `d19hzt4ehho5l3.cloudfront.net`, 경로 `/images/channels/3.jpg`를 확인한 기록을 유지한다.
  서명 쿼리 원문은 기록하지 않는다.
- 정확한 운영 HTTPS 호스트만 허용하며 upstream 리다이렉트·응답 크기·전체 timeout·이미지
  Content-Type/시그니처를 검사한다. 최신 공개 메타데이터 확인 후에만 제한된 캐시를 쓴다.
- 공개 해제 직후 CDN의 기존 응답은 이미지 최대 5분·HTML 최대 1분 남을 수 있다.
  상세 제한·폴백 조건은 README의 공개 공유 페이지 절을 따른다.

## 미검증·남은 확인

- 이번 자동 이동 변경의 운영 배포 및 실제 모바일 브라우저·인앱 브라우저의 자동 스토어 이동은
  미검증이다. Node `vm`은 실제 브라우저의 외부 앱 전환·탐색 제한 정책을 검증하지 않는다.
- 실기기 iOS Universal Links, 실제 메신저/SNS 미리보기·재수집·캐시 무효화는 미검증이다.
  기존 500px/1200px 아트워크 화면 검증은 제거된 UI에 대한 기록이므로 현재 화면 검증에 포함하지 않는다.
- Android는 정확한 Play 앱 서명 SHA-256 확보 후 `assetlinks.json`, 앱 HTTPS intent filter와
  autoVerify, 실기기 검증이 필요하다. 업로드 키나 디버그 키 지문으로 대체하지 않는다.
