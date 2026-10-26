# 공개 공유 링크 구현·검증 기록

- 날짜: 2026-10-26
- 기준: main `70ddf74`(PR #7), 작업 브랜치 `fix/share-fallback-restore`.
- 범위: PR #6 `c7e004a`의 전체 공유 UI/CSS 복원, 모바일 자동 이동의 방문 기록 보존,
  테스트·문서 수정. 앱·백엔드 변경이나 배포는 하지 않았다.
- 기존 운영·앱 검증 기록과 이번 코디네이터의 실제 Safari 진단, 웹 자동화 검증을 아래에서 구분한다.

## 현재 공유 흐름

1. 외부의 `/share/episode/{id}`·`/share/shorts/{id}` 링크는 OS의 유효한
   Universal/App Links 연결을 통해 앱에서 열릴 수 있다. Safari 주소창 입력이나 사용자의
   브라우저 열기 선택 때문에 앱이 설치되어 있어도 웹에 도달할 수 있다. 웹 도달은 앱
   미설치의 증거가 아니다. Android verified association은 아직 미구성이다.
2. 웹에 도달한 정상 공유 응답은 200 SSR HTML에 escaped OG/Twitter 메타,
   고정 `https://deulli.com` canonical, 서명 쿼리 없는 `/share/og/{kind}/{id}`를 포함한다.
   기존 익명 API 계약·이미지 프록시·캐시·오류 상태는 유지한다.
3. HTML의 작은 스크립트가 iPhone/iPod/iPad를 App Store로, Android를 Google Play로
   `location.assign`한다. iPad 데스크톱 UA는 `MacIntel`·`maxTouchPoints > 1`로 구분한다.
   주소는 `site.stores`에서 전달하며 서버 302·meta refresh·설치 감지 타이머·자동 scheme
   호출을 사용하지 않는다.
4. 알려진 크롤러/미리보기 UA, 데스크톱, 알 수 없는 플랫폼은 자동 이동하지 않는다.
   최초 `pageshow` 다음 `requestAnimationFrame`까지 기다려 이미지와 문서 로드 태스크가
   끝난 뒤 한 번만 이동을 시도한다. 백그라운드·사전 렌더링 문서는 활성화와 표시도 기다린다.
   설치 여부를 추측하는 대기 시간이 아니라 로드 생명주기로 순서를 제어한다.
5. 아트워크(`/share/og/{kind}/{id}`), 콘텐츠 종류·팟캐스트명(쇼츠)·제목·요약,
   수동 앱 열기 CTA, `StoreLinks` 배지, 브랜드 헤더·푸터의 전체 랜딩을 유지한다.
   JavaScript 비활성·자동 이동 차단·스토어에서 복귀한 경우에도 이 fallback을 사용할 수 있다.
   앱 열기는 기존 `deulli://app/{kind}/{id}`를 사용한다.
6. `replace` 대신 `assign`으로 공유 페이지를 방문 기록에 남긴다. BFCache 복귀는 기존
   일회성 상태를 유지하고, 새 문서로 뒤로/앞으로 복귀하면 Navigation Timing의
   `back_forward`를 보고 자동 이동하지 않는다. 이 API가 없는 브라우저의 새 문서 복귀
   판별은 제한된다. 이동 코드는 전체 랜딩 마크업 뒤에 둔다.
7. 잘못된 ID·없는/비공개 콘텐츠는 404, upstream 장애·계약 오류는 503 오류 페이지를
   유지한다. 오류 HTML에는 자동 이동 코드나 대상 표시를 넣지 않고 `no-store`를 유지한다.

스크립트는 `src/scripts/share-redirect.js`에 격리하고 성공 HTML에 그대로 포함한다.
Node `vm`으로 원본과 실제 개발/빌드 SSR HTML에 실린 코드를 실행해 HTML과 스크립트의
연결을 검증한다. 이는 브라우저·OS의 실제 스토어/앱 전환 검증은 아니다.
초기 HTML의 전체 fallback과 메타는 JavaScript 실행에 의존하지 않는다.

## 이번 실제 Safari·시뮬레이터 진단

아래는 코디네이터가 iPhone 17 / iOS 26.5 시뮬레이터의 실제 Safari에서 확인한 결과다.

- 자동 App Store 이동에서 잘못된 주소 알림을 재현했다. 알림을 닫고 기존 수동 App Store
  링크를 눌러도 같은 알림이 발생했다.
- 같은 시뮬레이터에서 `simctl get_app_container ... com.apple.AppStore app`은 `ENOENT`였다.
  App Store 앱이 없는 시뮬레이터의 네이티브 스토어 전환 실패로 진단했다. 이를 이유로
  운영 모바일 라우팅을 제거하거나 실제 iPhone과 구분되지 않는 UA에 예외를 넣지 않았다.
- 수동 `deulli://app/shorts/123` CTA는 Safari의 “들리에서 열겠습니까?” 확인 후 앱을 열었고,
  쇼츠 123의 제목 “바벨 들고 덤볐다가 군살이 치실이 된 롤프”를 확인했다.
  커스텀 scheme 실패와 App Store 전환 실패를 구분했다.
- 복원 UI에서 로드 중 즉시 이동했을 때는 Safari의 오류 알림을 닫아도 로고·아트워크가
  깨져 있었다. 이미지 프록시 자체는 200 JPEG 응답이었고, 이동이 진행 중인 이미지 요청을
  취소하는 문제를 분리했다. 문서 로드 완료 후 이동하도록 수정한 뒤 같은 Safari에서
  알림을 닫았을 때 로고·쇼츠 123 아트워크가 모두 정상 표시되는 것을 재확인했다.
- [Apple TN3155](https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links)는
  Safari 주소창에 직접 입력한 URL은 앱을 열지 않으며 브라우저 열기 선택도 영향을 준다고
  설명한다. 설치 여부를 타이머로 추측하거나 브라우저에서 확실히 감지한다고 안내하지 않는다.

이 진단은 실제 기기의 App Store 전환 성공이나 이번 복원본의 배포 후 동작을 검증하지 않는다.

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

| 검증                                   | 결과                                                                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm test`                            | 43/43 통과: 기존 계약·보안·캐시 30개와 모바일/데스크톱/iPad/크롤러/배경/사전 렌더링/차단/오류/로드 완료/방문 기록·복귀 테스트 13개                           |
| `pnpm lint`                            | Astro 0 errors/warnings/hints, ESLint 통과                                                                                                                   |
| `pnpm build`                           | 정적 홈과 Vercel SSR 함수 생성 통과                                                                                                                          |
| `pnpm test:http`                       | 개발 SSR HTTP 통과: 전체 fallback 콘텐츠·아트워크·앱/스토어 링크, OG/Twitter/escaping/canonical·실린 스크립트·방문 기록/복귀·PNG·404/503/retry/no-store·AASA |
| `pnpm test:http --built`               | 빌드된 Vercel 함수에서 같은 HTTP/스크립트 검증 통과, 정적 홈·SSR 라우팅 산출물 확인                                                                          |
| 변경 파일 Prettier, `git diff --check` | 통과                                                                                                                                                         |

리다이렉트 테스트는 iOS/Android/데스크톱/iPad와 모바일 UA를 가진 주요 crawler를 구분하고,
백그라운드 대기·prerender 활성화 순서·로드 완료 후 다음 프레임 대기·일회성 이동·이동 차단
예외를 확인한다. 로드 완료와 visibility/pageshow 이벤트가 중복되어도 한 번만 이동한다.
방문 기록을 모델링해 `replace`가 fallback을 지우는 회귀를 검출하고, BFCache 복귀와
`back_forward` 새 문서 복귀에서 재이동하지 않는지 확인한다. HTTP 테스트는 episode와
shorts 각각의 성공 HTML에서 콘텐츠·팟캐스트명·요약의 escaping, 로컬 아트워크 경로,
접근 가능한 앱 CTA/스토어 배지·브랜드 헤더/푸터와 실제 코드를 검증한다.
양쪽 404/503 HTML은 자동 이동 없이 상태·오류 메시지·재시도·홈/스토어 링크를 유지한다.

Orca 내장 Chromium 150에서 쇼츠 `8349`의 1200×900·390×844 viewport 화면을 확인했다.
두 크기 모두 아트워크 로드, 콘텐츠/CTA/스토어 배지 표시, 가로 넘침 없음을 확인했다.
데스크톱 UA를 유지한 반응형 레이아웃 검증이며 iOS Safari 검증이 아니다. Chromium의
UA만 iPhone으로 바꾸거나 Node VM에 iPhone UA를 넣어도 실제 Safari/OS 전환 검증이 되지 않는다.

별도 로컬 fixture에서 실제 Chromium의 방문 기록도 비교했다. 시작 링크 → 공유 스크립트
→ 로컬 mock store 이동 시, 파싱 중 즉시 `assign`과 `pageshow` 콜백 내부 `assign`은
방문 기록 길이가 2였고 Back이 시작 페이지로 돌아갔다. `pageshow` 다음 프레임의 `assign`은
길이가 3이었고 Back이 fallback 제목·수동 링크를 가진 공유 페이지로 돌아갔다.
복귀 문서의 Navigation Timing은 `back_forward`였다. 실제 스토어나 Safari의 방문 기록
정책을 검증한 결과와는 구분한다.

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

- 이번 복원본의 운영 배포, 실기기의 자동 스토어 이동과 외부 스토어에서의 방문 기록 복귀는
  미검증이다. Node `vm`의 history 모델은 실제 브라우저의 외부 앱 전환·탐색 정책을 검증하지 않는다.
- 실기기 iOS Universal Links, 실제 메신저/SNS 미리보기·재수집·캐시 무효화는 미검증이다.
  과거 화면 검증과 위의 이번 Chromium 화면 검증은 구분한다.
- Android는 정확한 Play 앱 서명 SHA-256 확보 후 `assetlinks.json`, 앱 HTTPS intent filter와
  autoVerify, 실기기 검증이 필요하다. 업로드 키나 디버그 키 지문으로 대체하지 않는다.
