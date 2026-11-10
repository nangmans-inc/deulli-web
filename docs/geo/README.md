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

HTTP 검사는 공개 페이지 다섯 개와 robots·sitemap URL을 순서대로 요청한다. 제품 백엔드 API·DB·개발 서버·앱 세션을 건드리지 않는다. HTTP 접근 성공은 실제 검색봇 IP의 접근 성공이나 색인을 증명하지 않는다.

AI 답변 측정은 `questions.json`의 같은 질문을 독립된 새 대화에서 실행하고 서비스·모델·검색 모드·일시·지역·답변 원문·인용 URL을 기록한다. 추천 질문에 들리를 미리 넣지 않는다. 브랜드 질문과 비브랜드 질문을 분리하고, 서비스별 각 질문 3회 이상을 권장한다. API 결과와 소비자 앱 결과도 별도로 집계한다.

OpenAI API 연결을 확인한 뒤 GPT-6 Luna와 GPT-6 Sol의 검색 기반 답변을 독립 요청으로 측정했다. 결과는 `research/api-*.jsonl`, 집계는 `research/api-summary.md`에 남긴다. 사용자의 브라우저 허용 후 실제 ChatGPT·Gemini 화면도 별도 측정했다. Perplexity 화면은 측정하지 않았다. 이 대화의 답변은 독립 표본에 포함하지 않는다.

URL을 직접 제시한 진단은 `diagnostic-questions.json`과 `research/api-direct-url.jsonl`로 구분한다. GPT-6 Sol이 공개 페이지 네 개를 실제 `open_page`로 열고 인용한 것을 확인했다. 이는 URL 지정 시 읽기 가능하다는 증거이며, 비브랜드 추천에서 자연스럽게 발견됐다는 뜻은 아니다.

```sh
python3 scripts/geo-measure.py --ids Q01,Q06,Q07 --output /tmp/deulli-observations.jsonl
# 위 명령은 계획만 출력한다. 실제 호출은 OPENAI_API_KEY 환경 변수와 --run이 필요하다.
python3 scripts/geo-report.py research.jsonl --output /tmp/deulli-summary.md
```

`--env-file`로 로컬 설정에서 키 하나만 읽을 수도 있다. 키·인증 헤더는 결과나 저장소에 남기지 않는다. 실행 시 API 비용이 발생한다. 각 요청은 검색 호출 최대 3회와 출력 최대 2,400토큰으로 제한하며, 인증·요청 형식·요청 한도 오류에서 중단한다.

## 반영 상태

제품 소개는 `src/content/pages/about.md`, 학습 가이드는 `src/content/guides/podcast-listening.md`로 구현했다(2026-11-10 구조 개편으로 `src/pages`에서 이동, 공개 주소는 동일). 홈에서 두 페이지를 연결하고 가이드끼리도 상호 연결했다. 기존 브랜드 토큰과 다운로드 배지를 사용하는 공통 읽기 레이아웃을 추가했다. 스토어 배지에는 기존 GA4 위임 로직이 수집할 `store_click` 이벤트와 스토어별 label을 연결했다. 배포·검색엔진 제출 상태는 후속 실행 기록에 남긴다.

앱 선택 가이드와 공식 팟캐스트 소개도 공개했다. 공식 에피소드 세 개는 기존 표본의 ID로 익명 공개 상태를 확인한 뒤 링크했고, 동일한 데이터에서 SSR 공유 경로 세 개를 사이트맵에 추가했다. 초기 운영 사이트맵은 8개 URL이며, 넓은 영어공부 가이드를 포함한 최신 소스는 9개 URL이다. 실제 동작 검증과 배포·제출 시각은 `research/execution-log.md`, 읽기 쉬운 AI 응답 증거는 `research/ai-answer-evidence.md`에 기록한다.

계정 연결이 필요한 스토어 정보 수정은 `content/store-metadata-patch.md`의 미적용안으로 구분했다. 운영 Analytics의 기준값은 공개 저장소에 넣지 않았다.

## 완료 기록

- [작업 결과와 미달성 항목](research/final-results.md)
- [전체 API 관측 144개 집계](research/api-summary.md)
- [실제 ChatGPT·Gemini 화면 관측](research/consumer-browser-observations.md)
- [Search Console 제출 결과](research/search-console-actions.md)
- [넓은 영어공부 의도 질문 9개](broad-intent-questions.json)
