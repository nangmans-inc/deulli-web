# 들리 검색 노출 작업

2026-11-06에 실행한 초기 조사다. 기존 `docs/geo.md`와 작업 중이던 홈 변경은 그대로 보존했다.

- [초기 조사와 실행 순서](research/2026-11-06.md)
- [제품 소개 원고](content/product.md)
- [학습 가이드 원고](content/listening-guide.md)
- [외부 소개용 원고](content/distribution.md)
- `questions.json`: 반복 측정할 질문 30개
- `research/search-snapshot.txt`: 검색 도구가 반환한 출처 제목·URL과 원 응답 해시. 여러 쿼리 결과가 합쳐져 있어 개별 쿼리 순위를 계산할 수 없다. 외부 본문은 재배포하지 않는다.
- `research/http-baseline.json`: 운영 홈페이지·robots·sitemap의 HTTP 관측

## 반복 실행

```sh
python3 scripts/geo-audit.py
python3 scripts/geo-audit.py --output /tmp/deulli-geo-followup.json
```

HTTP 검사는 공개 URL 세 개만 순서대로 요청한다. API·DB·개발 서버·앱 세션을 건드리지 않는다. User-Agent를 바꾼 HTTP 접근 성공은 실제 검색봇 IP의 접근 성공이나 색인을 증명하지 않는다.

AI 답변 측정은 `questions.json`의 같은 질문을 독립된 새 대화에서 실행하고 서비스·모델·검색 모드·일시·지역·답변 원문·인용 URL을 기록한다. 추천 질문에 들리를 미리 넣지 않는다. 브랜드 질문과 비브랜드 질문을 분리하고, 서비스별 각 질문 3회 이상을 권장한다. API 결과와 소비자 앱 결과도 별도로 집계한다.

현재 여러 AI 서비스의 API 자격증명이 없어 실제 AI 추천률은 **미측정**이다. 검색 결과에 없는 것을 AI 추천률 0%로 보고하지 않는다. 이 대화에서 만든 답변 또한 독립된 측정 표본이 아니다.

## 반영 상태

제품 소개는 `src/pages/about.md`, 학습 가이드는 `src/pages/guides/podcast-listening.md`로 구현했다. 홈에서 두 페이지를 연결하고 가이드끼리도 상호 연결했다. 기존 브랜드 토큰과 다운로드 배지를 사용하는 공통 읽기 레이아웃을 추가했다. 스토어 배지에는 기존 GA4 위임 로직이 수집할 `store_click` 이벤트와 스토어별 label을 연결했다. 배포·검색엔진 제출 상태는 후속 실행 기록에 남긴다.
