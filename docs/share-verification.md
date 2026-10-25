# 공개 공유 페이지 구현·검증 기록

- 날짜: 2026-10-25
- 기준: main `2ed677e`, 작업 브랜치 `feat/public-share-pages`
- 범위: deulli-web 공유 페이지 구현. 운영 배포는 수행하지 않았다.
- 교차 리뷰: 별도 Orca worker가 공유 계약·OG escaping·이미지 프록시·캐시·SSRF를 검토했다.
  웹 30개 테스트와 빌드된 Vercel 함수 HTTP 검증을 다시 실행해 통과했고, 웹 코드의 추가 결함은 발견하지 않았다.

## 변경

- Astro 5의 정적 홈을 유지하고 `/share/episode/{id}`·`/share/shorts/{id}`와
  `/share/og/{episode|shorts}/{id}`만 SSR로 추가했다.
- 최초 HTML에 escaped OG/Twitter 태그, 고정 `https://deulli.com` canonical,
  서명 쿼리 없는 OG 이미지 URL을 포함한다. 한국어 화면에서 앱 scheme·기존 스토어
  링크를 제공하며 자동 이동하지 않는다. 본문 이미지는 같은 서버의 상대 경로를 쓴다.
- 익명 episode·shorts 공개 API 계약을 검증하고 잘못된 ID/공개 불가에는 404,
  upstream 장애·응답 오류에는 503을 반환한다. 오류는 `no-store`다.
- 이미지 프록시는 fresh 메타데이터의 서명 URL만 사용하고 이미지 바이트를 반환한다.
  정확한 운영 CloudFront 호스트만 허용하고 리다이렉트·타임아웃·body 한도·형식을 검사한다.
  캐시·로컬 PNG 폴백의 조건과 TTL/메모리 상한은 README에 명시했다.
- 확인한 iOS identity로 AASA와 JSON 헤더 설정을 추가했다. Android assetlinks는 미생성이다.
- `API_BASE`, 배포 방식, association 전제, 테스트 명령을 README와 `.env.example`에 기록했다.

## 호환성·운영 근거

- 기존 lock의 Astro는 `5.18.2`다. [npm registry의 @astrojs/vercel 8.2.11](https://registry.npmjs.org/@astrojs%2fvercel/8.2.11)의
  peer가 `astro: ^5.0.0`임을 확인한 뒤 사용자 승인 전달을 받고
  `pnpm add --save-exact @astrojs/vercel@8.2.11`을 실행했다. lockfile은 pnpm이 생성했다.
- Node `v22.22.0`, pnpm `10.17.0`에서 검증했으며 Vercel 함수 산출물 runtime은 `nodejs22.x`다.
- 운영 익명 `GET https://api.deulli.nangmans.com/podcasts/105948`에서
  `thumbnail_url`의 호스트 `d19hzt4ehho5l3.cloudfront.net`, 경로 `/images/channels/3.jpg`를 확인했다.
  서명 쿼리 값은 기록하지 않았다.
- 형제 앱의 `ios/Flutter/Signing.xcconfig`에서 팀 `GT75SU9T79`,
  `ios/Runner.xcodeproj/project.pbxproj`에서 bundle `com.deulli.app`을 확인했다.

## 검증 결과

| 검증                                   | 결과                                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                            | 30/30 통과: API 계약, ID, anonymous 요청, 오류 구분, timeout/body 취소, SSRF/redirect/format/body 한도, fresh 서명, 안전 캐시·만료·entry 상한     |
| `pnpm lint`                            | Astro 타입 검사 0 errors/warnings/hints, ESLint 통과                                                                                              |
| `pnpm build`                           | 통과: 정적 `index.html`과 SSR `_render` 함수 생성                                                                                                 |
| `pnpm test:http`                       | Astro dev 실제 HTTP 통과: 양쪽 HTML OG/Twitter/escaping/canonical, 앱·스토어 링크, 상대 이미지 경로, 정확한 폴백 PNG, 404/503/no-store, AASA JSON |
| `pnpm test:http --built`               | 빌드된 Vercel Node 함수를 로컬 HTTP로 직접 실행해 같은 검증 통과, 정적 홈·SSR route 산출물 확인                                                   |
| 변경 파일 Prettier, `git diff --check` | 통과                                                                                                                                              |
| 운영 episode 105948 읽기 검증          | 메타데이터 OK, fresh 이미지 `200 image/png`, 931,414바이트, `Location` 없음                                                                       |
| 브라우저 화면                          | 실제 운영 에피소드 기준 500px·1200px에서 이미지·스토어 배지 정상 로딩, 가로 넘침 없음                                                             |

설치 시 기존 TypeScript 6에 대한 Astro 하위 의존성의 TypeScript 5 peer 경고와
pnpm 10.17의 esbuild/sharp build-script 무시 안내가 있었으나 실제 타입 검사·이미지 최적화·빌드는 통과했다.
전역 설치나 추가 의존성 변경은 하지 않았다.

## 미검증·후속 전제

- 배포하지 않았으므로 운영 Vercel의 SSR 라우팅·환경 변수·AASA MIME/HTTPS 응답·CDN 동작은 미검증이다.
- 새 Shorts 공개 API는 mock 계약으로 검증했다. 백엔드 계약 배포 후 실제 공개/비공개 Shorts 확인이 필요하다.
- iOS 배포 앱의 entitlement·프로비저닝과 Universal Links 실기기 연결은 앱/배포 작업에서 확인해야 한다.
- Play App Signing SHA-256은 미확인이다. 정확한 지문 확보 후 assetlinks, 앱 autoVerify와 실기기 확인이 필요하다.
- 390px 모바일 에뮬레이션은 브라우저 도구 프로토콜 오류로 확인하지 못했다. 실제 모바일 기기 검증은 수행하지 않았다.
- 메신저·SNS crawler의 실제 미리보기 및 기존 URL 재수집/캐시 무효화는 배포 후 확인해야 한다.
- 공개 해제 직후 기존 CDN 응답은 이미지 최대 5분·HTML 최대 1분 유지될 수 있다. 서버 캐시는 공개 여부를 새로 확인한 경우에만 폴백한다.
