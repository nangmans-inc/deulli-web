# 공개 공유 링크 구현·검증 기록

- 날짜: 2026-10-26
- 기준: main `c5d39ad`(PR #11), 작업 브랜치 `fix/mobile-share-app-open`.
- 범위: Android에서 추가한 즉시 앱 실행 시도를 iOS에도 적용한다.
  기존 4종류 SSR·OG 이미지·전체 fallback·Android intent와 association 파일은 유지하며 앱·백엔드는 변경하지 않았다.
- 이전 공유 fallback 복원 당시의 Safari·운영 검증 기록과 Android 준비 상태 기록은 유지했다.

## 채널·시리즈 확장

- 공개 주소는 `/share/channel/{id}`·`/share/series/{id}`, 이미지 주소는
  `/share/og/channel/{id}`·`/share/og/series/{id}`다. HTTPS canonical과 수동
  `deulli://app/channel/{id}`·`deulli://app/series/{id}` 링크를 제공한다.
- 익명 경량 API 계약은 `GET /channels/{id}/share`의 `{id,name,description,cover_url}`와
  `GET /series/{id}/share`의 `{id,title,description,cover_url}`다. 숫자 ID 일치·제목 문자열을
  검증하고 `description`·`cover_url`의 null을 허용한다. 설명과 404/503 fallback은 채널·시리즈를
  올바르게 표시한다. 기존 에피소드·쇼츠 계약과 화면은 유지한다.
- 기존 정확한 CloudFront 호스트 allowlist·redirect 거부·128 KiB/5 MiB body 제한·5초 timeout을
  재사용한다. signed `cover_url`은 서버에서만 사용하고 HTML·응답 헤더에는 고정 프록시 주소만 제공한다.
- AASA는 기존 appID를 그대로 두고 채널·시리즈 경로만 추가했다. Android assetlinks의 3개 서명,
  패키지·관계·호스팅 헤더는 변경하지 않았다.
- 자동화 검증은 신규 API와 서명 표지 응답을 로컬 fixture로 대체한다. HTTP harness의 이미지 fetch
  대체 모듈은 테스트에서만 preload하며 운영 번들에 포함하지 않는다. 실제 Astro dev와 빌드된 Vercel
  SSR 함수에서 4종류의 OG/Twitter·escaping·고정 canonical·전체 fallback·앱/스토어 링크·프록시
  바이트·null 메타·404/503·잘못된 경로·봇/데스크톱 skip·pageshow+rAF·back_forward를 확인한다.
- Vercel 설정과 빌드 harness는 AASA의 JSON Content-Type·캐시 헤더를 확인한다.
  Astro dev는 확장자 없는 정적 파일에 Vercel 헤더를 적용하지 않으므로 dev HTTP에서는
  AASA의 200·비리다이렉트·JSON 본문만 확인한다. 운영 HTTPS 헤더 검증을 뜻하지 않는다.
- 신규 API는 운영 배포 전 404 상태라는 인계에 따라 성공 사례를 fixture로 검증했다.
  실제 운영 신규 API의 응답·서명 cover 다운로드, 신규 앱 라우팅, OS association 캐시,
  실기기 앱/스토어 이동, 메신저 미리보기는 이번 웹 작업에서 검증하지 않았다.

## 현재 공유 흐름

1. 외부의 `/share/episode/{id}`·`/share/shorts/{id}`·`/share/channel/{id}`·`/share/series/{id}` 링크는 OS의 유효한
   Universal/App Links 연결을 통해 앱에서 열릴 수 있다. Safari 주소창 입력이나 사용자의
   브라우저 열기 선택 때문에 앱이 설치되어 있어도 웹에 도달할 수 있다. 웹 도달은 앱
   미설치의 증거가 아니다. Android association 파일은 준비했으며 배포·앱 릴리스·실기기
   검증이 남아 있다.
2. 웹에 도달한 정상 공유 응답은 200 SSR HTML에 escaped OG/Twitter 메타,
   고정 `https://deulli.com` canonical, 서명 쿼리 없는 `/share/og/{kind}/{id}`를 포함한다.
   기존 익명 API 계약·이미지 프록시·캐시·오류 상태는 유지한다.
3. iOS·Android는 정상 공유 HTML의 스크립트 실행 시 `deulli://app/{kind}/{id}`를 즉시 한 번
   시도한다. 설치 여부를 추측하거나 자동으로 스토어로 보내지 않는다. Android 수동 앱 열기
   버튼은 동일 경로와 고정 패키지 `com.deulli.app`의 `intent:` 링크로 바꾸고, 명시적 탭에서만
   기존 Play 주소를 `browser_fallback_url`로 제공한다. iOS 수동 버튼은 custom scheme을 사용한다.
   타이머·외부 브라우저 강제 호출은 없다. iPad 데스크톱 UA는
   `MacIntel`·`maxTouchPoints > 1`로 구분하며 스토어 주소는 `site.stores`에서 전달한다.
4. 알려진 크롤러/미리보기 UA, 데스크톱, 알 수 없는 플랫폼은 자동 이동하지 않는다.
   양쪽 모두 아트워크 다운로드나 `pageshow`를 기다리지 않는다.
   양쪽 모두 백그라운드·사전 렌더링 문서는 활성화와 표시를 기다리며 한 번만 시도한다.
5. 아트워크(`/share/og/{kind}/{id}`), 콘텐츠 종류·팟캐스트명(쇼츠)·제목·요약,
   수동 앱 열기 CTA, `StoreLinks` 배지, 브랜드 헤더·푸터의 전체 랜딩을 유지한다.
   JavaScript 비활성·자동 이동 차단·스토어에서 복귀한 경우에도 이 fallback을 사용할 수 있다.
   JavaScript가 없거나 Android 외 환경이면 수동 앱 열기는 기존
   `deulli://app/{kind}/{id}`를 사용한다.
6. `assign`으로 앱 실행을 시도한다. BFCache 복귀는 기존
   일회성 상태를 유지하고, 새 문서로 뒤로/앞으로 복귀하면 Navigation Timing의
   `back_forward`를 보고 자동 이동하지 않는다. 이 API가 없는 브라우저의 새 문서 복귀
   판별은 제한된다. 이동 코드는 전체 랜딩 마크업 뒤에 둔다.
7. 잘못된 ID·없는/비공개 콘텐츠는 404, upstream 장애·계약 오류는 503 오류 페이지를
   유지한다. 오류 HTML에는 자동 이동 코드나 대상 표시를 넣지 않고 `no-store`를 유지한다.

스크립트는 `src/scripts/share-redirect.js`에 격리하고 성공 HTML에 그대로 포함한다.
Node `vm`으로 원본과 실제 개발/빌드 SSR HTML에 실린 코드를 실행해 HTML과 스크립트의
연결을 검증한다. 이는 브라우저·OS의 실제 스토어/앱 전환 검증은 아니다.
초기 HTML의 전체 fallback과 메타는 JavaScript 실행에 의존하지 않는다.

### 모바일 카카오 인앱 브라우저 보완

카카오에서 앱이 설치돼 있어도 웹뷰로 공유 페이지가 열릴 수 있으므로, 웹 도달을 미설치로
간주하던 스토어 직행을 양쪽 모두 제거했다. 자동 실행이 차단돼도 스토어로 재시도하지 않으며 기존 전체
fallback을 유지한다. Android 수동 버튼은 사용자의 탭에서 실행할 수 있도록 `intent:` href를 제공한다.
뒤로/앞으로 복귀에서는 자동 실행을 건너뛰어도 Android 수동 버튼은 계속 사용할 수 있다.

[Chrome 공식 문서](https://developer.chrome.com/docs/android/intents)는 사용자 제스처가 없는
외부 앱 호출을 차단할 수 있으며, 이 경우 `browser_fallback_url`로 이동할 수도 있다고 설명한다.
따라서 자동 시도에는 스토어 fallback을 넣지 않았다. Node VM과 HTTP 검증은 호출 주소·실행 순서·
일회성 처리·fallback 보존을 확인하며, 실제 카카오/기기에서의 앱 실행 성공을 의미하지 않는다.
앱의 `deulli://app` 수신은 iOS·Android 모두 1.4.2부터 포함된다. 이전 스토어 버전 1.4.1의
Android manifest·iOS Info.plist에는 해당 scheme 등록이 없으므로 새 앱 버전도 필요하다.
앱·백엔드·association 파일은 이번에 수정하지 않는다.

보완 후 단위 검사 53/53, Astro check 0 errors/warnings/hints, 개발 서버·빌드된 Vercel 함수의
4종류 HTTP 검증과 운영 빌드가 통과했다. ESLint도 기존 로컬 증거 디렉터리 `tmp/**`를 제외하면
통과했다. 기본 `pnpm lint`는 변경 전부터 존재한 `tmp/channel-series-production-release/audit-production.mjs`의
불필요한 escape 한 건을 함께 검사해 실패했으며, 해당 과거 증거 파일은 수정하지 않았다.

## 이전 Safari·시뮬레이터 진단

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
- 기존 iOS AASA 대상은 `GT75SU9T79.com.deulli.app`, 경로는 `/share/episode/*`·`/share/shorts/*`였다.
  이번 작업본은 appID를 유지하고 `/share/channel/*`·`/share/series/*`만 추가했다.
  운영 도메인·앱 entitlement/프로비저닝·OS association 캐시가 연결의 전제다.
- Android 웹 association과 Play 서명 인증서 출처는 다음 절에 기록했다.
  운영 배포 후 verified App Links와 실기기 동작은 미검증이다.

## Android App Links 웹 설정

`public/.well-known/assetlinks.json`은 `android_app` 패키지 `com.deulli.app`에
`delegate_permission/common.handle_all_urls`를 부여한다. 운영 앱 서명 SHA-256은 파일에
기록한 **3개만** 사용한다. Vercel에 해당 경로의 `application/json`과
`Cache-Control: public, max-age=3600`을 명시했으며 SSR 대신 정적 파일로 제공한다.

2026-10-26 코디네이터가 로그인된 소유자 계정의 NAVER Whale에서
[Play Console 앱 무결성 페이지](https://play.google.com/console/u/0/developers/5473866273185092286/app/4976048264985058292/keymanagement)를 열어
업로드 키 영역 위 **앱 서명** 영역의 “모든 인증서 지문 복사” → SHA-256으로 확보했다.
Console이 생성한 연결 JSON에는 첫 인증서만 있었으나 전체 앱 서명 복사 결과는 3개였다.
[Google Play 공식 안내](https://support.google.com/googleplay/android-developer/answer/9842756)의
키 업그레이드 후 모든 서명 인증서 지문 등록 지침에 따라 전체를 등록했다.
코디네이터가 별도 업로드 키 SHA-256과 대조해 이 3개에 포함되지 않음을 확인했다.
로컬 디버그·업로드 키는 사용하지 않았다.

앱 작업본에는 HTTPS `autoVerify` intent filter가 추가되어 있다. 이를 포함한 서명 앱의
Play 릴리스가 별도로 필요하며, 웹 배포만으로 기존 설치 앱에 intent filter를 추가할 수 없다.
코디네이터가 기존 로컬 AAB `1.4.0+13`·`1.4.1+15`의 manifest를 읽기 전용으로 검사했으며
해당 산출물에는 HTTPS App Links 설정이 없었다.
이번 작업에서는 앱 작업본을 수정하지 않았다. `adb devices`가 비어 실기기 검증은 못 했다.

배포 후 다음 순서로 확인한다.

1. `curl --max-redirs 0 -i https://deulli.com/.well-known/assetlinks.json`으로 인증 없는
   HTTPS 200·리다이렉트 없음·JSON MIME·캐시 헤더와 본문의 패키지/지문 3개를 확인한다.
2. Google Digital Asset Links에서 각 운영 인증서와 `com.deulli.app`의
   `delegate_permission/common.handle_all_urls` 연결을 확인한다.
3. 해당 intent filter를 포함한 Play 서명 릴리스를 실기기에 설치한 뒤
   `adb shell pm verify-app-links --re-verify com.deulli.app`을 실행한다. 검증이 끝나면
   `adb shell pm get-app-links com.deulli.app`에서 `deulli.com: verified`를 확인한다.
4. 외부 앱의 실제 `/share/episode/{id}`·`/share/shorts/{id}` HTTPS 링크에서 warm/cold 실행과
   대상 콘텐츠 열기를 확인하고, 앱이 없는 경우 기존 웹·스토어 fallback도 확인한다.

로컬 HTTP 검증은 Vercel 정적 산출물·라우팅·선언 헤더를 검사하며 운영 HTTPS·Google 응답이나
기기 연결 성공을 검증하지 않는다. 운영 배포와 원격 확인은 코디네이터가 별도로 담당한다.

## 이번 로컬 검증 결과

Node `v22.22.0`, pnpm `10.17.0`을 사용했고 추가 의존성을 설치하지 않았다.

| 검증                                        | 결과                                                                                                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                 | 49/49 통과: 기존 43개와 채널·시리즈 계약/서명 표지/nullable·오류 테스트 6개, 기존 URL·익명 upstream·잘못된 경로 테스트를 4종류로 확장                     |
| `pnpm lint`                                 | Astro 0 errors/warnings/hints, ESLint 통과                                                                                                                |
| `pnpm build`                                | 정적 홈과 Vercel SSR 함수 생성 통과                                                                                                                       |
| `pnpm test:http`                            | 4종류의 SSR fallback·OG/Twitter·앱/스토어 링크·signed cover bytes·nullable·404/503·잘못된 경로와 기존 이동 동작 통과, AASA 4경로·assetlinks 3개 서명 확인 |
| `pnpm test:http --built`                    | 같은 SSR 검증과 빌드된 두 association 파일 HTTP 제공·원본 일치·Vercel 선언 MIME/캐시 헤더·filesystem 라우팅, 정적 홈·SSR 산출물 확인                      |
| 변경 코드·AASA Prettier, `git diff --check` | 통과                                                                                                                                                      |

리다이렉트 테스트는 iOS/Android/데스크톱/iPad와 모바일 UA를 가진 주요 crawler를 구분하고,
백그라운드 대기·prerender 활성화 순서·로드 완료 후 다음 프레임 대기·일회성 이동·이동 차단
예외를 확인한다. 로드 완료와 visibility/pageshow 이벤트가 중복되어도 한 번만 이동한다.
방문 기록을 모델링해 `replace`가 fallback을 지우는 회귀를 검출하고, BFCache 복귀와
`back_forward` 새 문서 복귀에서 재이동하지 않는지 확인한다. HTTP 테스트는 episode·shorts·channel·series
각각의 성공 HTML에서 콘텐츠·팟캐스트명(쇼츠)·요약의 escaping, 로컬 아트워크 경로,
접근 가능한 앱 CTA/스토어 배지·브랜드 헤더/푸터와 실제 코드를 검증한다.
네 유형의 404/503 HTML은 자동 이동 없이 상태·오류 메시지·재시도·홈/스토어 링크를 유지한다.

기존 fallback 복원 작업에서는 Orca 내장 Chromium 150에서 쇼츠 `8349`의 1200×900·390×844 viewport 화면을 확인했다.
두 크기 모두 아트워크 로드, 콘텐츠/CTA/스토어 배지 표시, 가로 넘침 없음을 확인했다.
데스크톱 UA를 유지한 반응형 레이아웃 검증이며 iOS Safari 검증이 아니다. Chromium의
UA만 iPhone으로 바꾸거나 Node VM에 iPhone UA를 넣어도 실제 Safari/OS 전환 검증이 되지 않는다.

같은 이전 작업의 별도 로컬 fixture에서 실제 Chromium의 방문 기록도 비교했다. 시작 링크 → 공유 스크립트
→ 로컬 mock store 이동 시, 파싱 중 즉시 `assign`과 `pageshow` 콜백 내부 `assign`은
방문 기록 길이가 2였고 Back이 시작 페이지로 돌아갔다. `pageshow` 다음 프레임의 `assign`은
길이가 3이었고 Back이 fallback 제목·수동 링크를 가진 공유 페이지로 돌아갔다.
복귀 문서의 Navigation Timing은 `back_forward`였다. 실제 스토어나 Safari의 방문 기록
정책을 검증한 결과와는 구분한다.

## 이미지 계약·보안 근거

- 기존 에피소드·쇼츠 익명 API 계약과 바이트 프록시 보안은 유지하고 채널·시리즈 경로를 추가했다.
- 2026-10-25 운영 익명 `GET /podcasts/105948`에서 이미지 호스트
  `d19hzt4ehho5l3.cloudfront.net`, 경로 `/images/channels/3.jpg`를 확인한 기록을 유지한다.
  서명 쿼리 원문은 기록하지 않는다.
- 정확한 운영 HTTPS 호스트만 허용하며 upstream 리다이렉트·응답 크기·전체 timeout·이미지
  Content-Type/시그니처를 검사한다. 최신 공개 메타데이터 확인 후에만 제한된 캐시를 쓴다.
- 공개 해제 직후 CDN의 기존 응답은 이미지 최대 5분·HTML 최대 1분 남을 수 있다.
  상세 제한·폴백 조건은 README의 공개 공유 페이지 절을 따른다.

## 미검증·남은 확인

- 이번 채널·시리즈 확장의 운영 API 성공 응답·실제 signed cover·운영 웹 배포는 미검증이다.
  백엔드 경량 API 배포 후 익명 200·계약 필드·이미지 allowlist 호스트 일치를 확인해야 한다.
- 기존 fallback 복원본과 이번 확장의 실기기 자동 스토어 이동·외부 스토어에서의 방문 기록 복귀는
  미검증이다. Node `vm`의 history 모델은 실제 브라우저의 외부 앱 전환·탐색 정책을 검증하지 않는다.
- 실기기 iOS Universal Links, 실제 메신저/SNS 미리보기·재수집·캐시 무효화는 미검증이다.
  과거 화면 검증과 위의 이번 Chromium 화면 검증은 구분한다.
- Android는 웹 association의 운영 배포·HTTPS/Google 원격 확인, HTTPS `autoVerify` intent filter를
  포함하는 Play 서명 앱 릴리스와 실기기 검증이 남아 있다. `adb devices`가 비어 기기 검증은 불가했다.
