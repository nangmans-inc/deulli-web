# 스토어 공개 설명 수정안

확인 기준: 2026-11-06 KST. **제안 원고이며 스토어에 저장·제출하지 않았다.** App Store Connect·Play Console 전용 도구는 이번 세션에 없다. 운영자의 이메일 수신 설정이나 구독 상품은 변경하지 않는다.

## 직접 확인한 문제

- Apple의 공개 lookup 응답에서 `sellerUrl`은 제공되지 않았다. 공식 홈페이지 항목이 설정되어 있지 않을 가능성을 점검해야 하며, 이 한 필드만으로 관리 화면의 설정 상태를 확정하지 않는다.
- 현재 Apple 공개 설명과 Google Play의 한국어·한국 지역 공개 응답에서 `https://contact@deulli.com` 표기를 확인했다. 이는 이메일 주소에 HTTPS 접두어를 붙인 문자열로, 문의 링크로 사용할 형식이 아니다.
- Google Play 응답에서 추출한 자사 도메인 링크는 이메일 표기와 정책·라이선스 페이지였다. 이 관측만으로 모든 지역·관리 화면에 홈페이지가 없다고 단정하지 않는다.
- 검색 도구의 App Store 결과에는 이전 설명의 가격·생성 분량이 남아 있었다. 최신 lookup과 다르므로 검색 결과만 보고 구독 조건을 원고에 복사하지 않는다.

출처: [Apple 공개 조회](https://itunes.apple.com/lookup?id=6798545609&country=kr), [Google Play 한국어 목록](https://play.google.com/store/apps/details?id=com.deulli.app&hl=ko&gl=KR). Google Play는 웹 검색 도구에서 열리지 않았으나 직접 HTTP 요청에서 상태 200·들리 이름·패키지 ID를 확인했다. 직접 요청 성공을 검색 색인 확인으로 해석하지 않는다.

## 본문 마지막에 사용할 원고

```text
공식 홈페이지: https://deulli.com
기능과 지원 기기: https://deulli.com/about/
이메일 문의: contact@deulli.com
이용 약관: https://deulli.policy.nangmans.com/terms
개인정보 처리방침: https://deulli.policy.nangmans.com/privacy
콘텐츠 및 오픈소스 라이선스: https://deulli.policy.nangmans.com/licenses
```

설명에서 이메일을 단순 텍스트로 쓰면 잘못된 HTTPS 링크를 피할 수 있다. HTML 이메일 링크를 받는 자체 사이트에서는 `mailto:contact@deulli.com` 형식이 적합하다. 스토어 설명에 HTML을 넣지는 않는다. 기존 스토어에 표시된 이메일을 그대로 유지한 수정안이며 다른 이메일로 통일하거나 수신 가능 여부를 검증한 것은 아니다.

## 별도 URL 항목 제안

- 마케팅/개발자 웹사이트: `https://deulli.com/`
- 지원 URL: `https://deulli.policy.nangmans.com/support`
- 개인정보 URL: `https://deulli.policy.nangmans.com/privacy`

자체 웹사이트는 이미 App Store·Google Play를 연결한다. 위 수정은 스토어에서 공식 웹사이트로 돌아오는 제품 식별 경로를 명확히 하려는 것이다. 검색 엔진이나 AI의 노출·추천을 보장하지 않는다. 실제 저장 시 관리 화면의 현행 필드·검토 절차와 기존 운영 원고를 확인해야 한다.
