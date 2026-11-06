# 제품 발견 경로 보강 · 2026-11-06

정오 관측에서 일반 추천 노출 성과를 확인하지 못한 뒤 수행한 실제 변경이다. 반복 측정을 실행 성과로 대체하지 않는다.

## 공식 제품 정보

영문 검색어가 많았던 관측을 바탕으로 공식 영문 소개 `/en/about/`를 추가했다. 한국어 화자를 위한 영어 팟캐스트 앱이라는 대상, 영문 스크립트·한국어 번역·대화 재청취, 지원되는 공식 콘텐츠의 화자별 음성 언어와 iPhone 잠금화면 기능을 설명한다. 영문 UI 지원이나 Android 잠금화면 기능을 새로 주장하지 않는다. 근거는 기존 한국어 제품 설명과 검증한 공개 스토어 정보다.

한국어 소개와 상호 링크 및 `hreflang`을 연결하고 각 페이지는 자체 canonical을 유지한다. 영문 페이지의 HTML 언어·OG locale·읽기 영역·다운로드 링크는 영어로 표시한다. 앱 자체의 언어를 기술하는 기존 MobileApplication 정보는 그대로다. README에서도 영문 제품 원문으로 연결한다.

영문 페이지 추가가 일반 추천을 늘린다는 인과 효과는 아직 검증하지 않았다. 질문 변형마다 페이지를 양산하지 않으며 새 AI 전용 파일을 노출 요건으로 제시하지 않는다.

## 정책 사이트에서 공식 웹으로 연결

[정책 PR #5](https://github.com/nangmans-inc/deulli-policy/pull/5)를 병합했다. 6개 페이지에 공식 홈페이지 링크 한 줄과 최소 클릭 영역만 추가했다. 삽입한 한 줄을 제거한 파일을 기존 main과 비교해 원래 법률 본문 바이트가 동일함을 재확인했다. 사용자의 별도 로컬 정책 변경은 건드리지 않았다.

운영 support·terms·privacy·licenses·refund·account-deletion 6개 URL의 HTTP 200과 공식 홈페이지 링크를 확인했다. 영수증은 `policy-links-live.json`이다. 독립 외부 리뷰나 추천을 얻었다는 뜻은 아니다.

## 현재 접근 제약

스토어의 잘못된 HTTPS 이메일과 공식 홈페이지 항목은 기존 [수정 원고](../overnight-2026-11-06/store-metadata-corrections.md)에 있다. 사용 가능한 전용 도구와 플러그인을 조회했으나 이번 검색에서는 스토어 메타데이터를 수정할 관리 연결을 찾지 못했다. 스토어에 저장·제출했다고 보고하지 않는다.

로그인된 사용자 창·입력 장치·프로필을 사용하는 대신 분리된 headless Chrome에서 검증했다. Search Console의 현재 색인·설정 확인에는 인증된 비-UI 접근 수단이 아직 없다.

## 최신 Google 안내에서 추가로 확인할 항목

Google의 2026-07-10 문서는 Search Console의 Search generative AI 포함 설정과 별도 Generative AI performance report를 안내한다. [최신 최적화 안내](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [포함 제어](https://support.google.com/webmasters/answer/16908024), [AI 노출 보고서](https://support.google.com/webmasters/answer/16984139).

포함이 기본값이지만 하위 속성은 부모 설정을 상속할 수 있다. 들리의 실제 값은 아직 확인하지 못했으며 제외돼 있다고 단정하지 않는다. 보고서가 보이지 않는 것도 노출 부족 등 여러 이유가 있어 0회 노출의 확정 근거로 쓰지 않는다. 일반 Google 자연 유입이나 자체 API 샘플과 이 보고서의 실제 AI 노출을 구분한다.

## Delivery Gate

기존 Figma의 Pretendard·네이비 본문·블루 링크와 GuideLayout을 사용한다. ENERGY 1 / RHYTHM 1 / MOTION 1. 긴 제품 설명을 읽는 구조를 유지하고 영문 다운로드 링크에는 실제 목적지와 48px 이상 클릭 영역을 제공한다.

- Hard Gate PASS: 8페이지 × 320/390/768/1440px에서 가로 넘침·링크 이름·가시 키보드 포커스·페이지 오류 검사 통과. 한국어↔영문 링크를 실제 클릭해 이동 확인. 앱 ID와 스토어 URL은 기존 검증값이다.
- Purpose Gate PASS: 제목은 제품 분류, 본문 섹션은 기능 범위 구분, 블루는 이동 링크, 여백은 읽기 위계에 사용한다. 새 장식이나 가짜 후기·성과·기능을 만들지 않았다.
- Liveliness PASS: 기존 로고·타입 대비·문장 중심 구성으로 제품 정체성을 유지한다. 390px·1440px 전체 화면을 확인했고 선언한 읽기 리듬과 정적 동작에 맞는다.
- Craftsmanship PASS: Astro·ESLint 오류/경고 0, 빌드 성공, 기존 테스트 53개 통과. HTML 언어·자체 canonical·양방향 hreflang·새 sitemap URL을 확인했다. Analytics/Meta 요청은 headless 검사에서 차단했다.

이 Gate는 변경본의 품질 검증이며 검색 색인·추천 성공의 증거가 아니다.

## 운영 반영 확인

[웹 PR #23](https://github.com/nangmans-inc/deulli-web/pull/23)은 12:17 KST에 병합됐다. 운영의 한국어 소개·영문 소개·사이트맵이 모두 200이며 검증한 로컬 빌드와 SHA-256이 일치한다. 사이트맵은 새 영문 소개를 포함한 11개 URL이다. 운영 headless에서도 한국어→영어→한국어 이동과 문서 언어·다운로드 링크를 확인했다. `production-content.json`에 HTTP/본문 영수증을 보존했다.

운영 원문 확인 후 두 소개 URL의 IndexNow 제출이 HTTP 200으로 수락됐다. `indexnow-product-information.json`은 제출 영수증이며 색인·추천 완료가 아니다. 공개 GitHub 저장소 설명에도 검증된 영문 제품 요약을 추가했고 기존 홈페이지 주소와 주제는 유지했다. 타사 평가나 독립 추천으로 표현하지 않는다.
