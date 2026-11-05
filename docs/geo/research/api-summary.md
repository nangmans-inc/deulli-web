# API 답변 관측 집계

검색을 사용한 독립 API 요청이다. 소비자용 ChatGPT 결과나 GEO 작업의 인과 효과를 뜻하지 않는다.

브랜드명 후보 출현은 추천 여부나 올바른 제품 식별과 다르다. 공식 스토어 인용과 공식 도메인 인용도 따로 센다.

| 모델 | 질문 구분 | 요청 | 완료 답변 | 검색 실행 | 브랜드명 후보 | 공식 웹 인용 | 공식 스토어 인용 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| gpt-6-luna | 제품명·분야 명시 | 4 | 4 | 4 | 4 | 0 | 2 |
| gpt-6-luna | 넓은 영어공부 의도 | 9 | 9 | 9 | 0 | 0 | 0 |
| gpt-6-luna | 비브랜드 | 37 | 37 | 37 | 0 | 0 | 0 |
| gpt-6-luna | 브랜드 포함 | 17 | 17 | 17 | 17 | 0 | 5 |
| gpt-6-luna | 제품 기능 기반 탐색 | 12 | 12 | 12 | 0 | 0 | 0 |
| gpt-6-sol | 제품명·분야 명시 | 4 | 4 | 4 | 3 | 0 | 3 |
| gpt-6-sol | 공식 홈페이지 찾기 | 2 | 2 | 2 | 2 | 0 | 2 |
| gpt-6-sol | 넓은 영어공부 의도 | 9 | 9 | 9 | 0 | 0 | 0 |
| gpt-6-sol | URL 지정 진단 | 4 | 4 | 4 | 4 | 4 | 0 |
| gpt-6-sol | 비브랜드 | 17 | 17 | 17 | 0 | 0 | 0 |
| gpt-6-sol | 브랜드 포함 | 17 | 17 | 17 | 14 | 0 | 17 |
| gpt-6-sol | 제품 기능 기반 탐색 | 12 | 12 | 12 | 0 | 0 | 0 |

## 인용 도메인

- apps.apple.com: 62회
- trypodling.com: 25회
- learnenglish.britishcouncil.org: 24회
- www.lingoreel.com: 24회
- playlingo.app: 12회
- podcasts.apple.com: 10회
- deulli.com: 10회
- play.google.com: 9회
- www.britishcouncil.kr: 8회
- support.apple.com: 8회
- support.spotify.com: 8회
- www.britishcouncil.org: 7회
- downloads.bbc.co.uk: 6회
- podcast.parroto.app: 6회
- support.google.com: 5회
- rehearapp.com: 5회
- learningenglish.voanews.com: 4회
- www.lingq.com: 4회
- deulli.de: 4회
- support.pocketcasts.com: 4회

## 질문별 확인 위치

| 파일 | 질문 | 상태 | 브랜드명 후보 | 공식 웹 인용 | 인용 수 |
| --- | --- | --- | --- | --- | ---: |
| api-brand-context-gpt-6-luna.jsonl | B01 | completed | True | False | 2 |
| api-brand-context-gpt-6-luna.jsonl | B02 | completed | True | False | 1 |
| api-brand-context-gpt-6-luna.jsonl | B03 | completed | True | False | 1 |
| api-brand-context-gpt-6-luna.jsonl | B04 | completed | True | False | 1 |
| api-brand-context-gpt-6-sol.jsonl | B01 | completed | True | False | 2 |
| api-brand-context-gpt-6-sol.jsonl | B02 | completed | True | False | 1 |
| api-brand-context-gpt-6-sol.jsonl | B03 | completed | False | False | 1 |
| api-brand-context-gpt-6-sol.jsonl | B04 | completed | True | False | 1 |
| api-broad-intent-gpt-6-luna.jsonl | G01 | completed | False | False | 3 |
| api-broad-intent-gpt-6-luna.jsonl | G02 | completed | False | False | 1 |
| api-broad-intent-gpt-6-luna.jsonl | G03 | completed | False | False | 3 |
| api-broad-intent-gpt-6-luna.jsonl | G04 | completed | False | False | 3 |
| api-broad-intent-gpt-6-luna.jsonl | G05 | completed | False | False | 1 |
| api-broad-intent-gpt-6-luna.jsonl | G06 | completed | False | False | 2 |
| api-broad-intent-gpt-6-luna.jsonl | G07 | completed | False | False | 3 |
| api-broad-intent-gpt-6-luna.jsonl | G08 | completed | False | False | 3 |
| api-broad-intent-gpt-6-luna.jsonl | G09 | completed | False | False | 2 |
| api-broad-intent-gpt-6-sol.jsonl | G01 | completed | False | False | 3 |
| api-broad-intent-gpt-6-sol.jsonl | G02 | completed | False | False | 4 |
| api-broad-intent-gpt-6-sol.jsonl | G03 | completed | False | False | 3 |
| api-broad-intent-gpt-6-sol.jsonl | G04 | completed | False | False | 3 |
| api-broad-intent-gpt-6-sol.jsonl | G05 | completed | False | False | 4 |
| api-broad-intent-gpt-6-sol.jsonl | G06 | completed | False | False | 5 |
| api-broad-intent-gpt-6-sol.jsonl | G07 | completed | False | False | 4 |
| api-broad-intent-gpt-6-sol.jsonl | G08 | completed | False | False | 3 |
| api-broad-intent-gpt-6-sol.jsonl | G09 | completed | False | False | 3 |
| api-direct-url.jsonl | D01 | completed | True | True | 2 |
| api-direct-url.jsonl | D02 | completed | True | True | 2 |
| api-episodes-url.jsonl | D05 | completed | True | True | 3 |
| api-features-gpt-6-luna.jsonl | F01 | completed | False | False | 1 |
| api-features-gpt-6-luna.jsonl | F02 | completed | False | False | 2 |
| api-features-gpt-6-luna.jsonl | F03 | completed | False | False | 1 |
| api-features-gpt-6-luna.jsonl | F04 | completed | False | False | 3 |
| api-features-gpt-6-luna.jsonl | F05 | completed | False | False | 4 |
| api-features-gpt-6-luna.jsonl | F06 | completed | False | False | 3 |
| api-features-gpt-6-luna.jsonl | F07 | completed | False | False | 2 |
| api-features-gpt-6-luna.jsonl | F08 | completed | False | False | 2 |
| api-features-gpt-6-luna.jsonl | F09 | completed | False | False | 1 |
| api-features-gpt-6-luna.jsonl | F10 | completed | False | False | 2 |
| api-features-gpt-6-luna.jsonl | F11 | completed | False | False | 3 |
| api-features-gpt-6-luna.jsonl | F12 | completed | False | False | 3 |
| api-features-gpt-6-sol.jsonl | F01 | completed | False | False | 2 |
| api-features-gpt-6-sol.jsonl | F02 | completed | False | False | 2 |
| api-features-gpt-6-sol.jsonl | F03 | completed | False | False | 2 |
| api-features-gpt-6-sol.jsonl | F04 | completed | False | False | 2 |
| api-features-gpt-6-sol.jsonl | F05 | completed | False | False | 3 |
| api-features-gpt-6-sol.jsonl | F06 | completed | False | False | 2 |
| api-features-gpt-6-sol.jsonl | F07 | completed | False | False | 2 |
| api-features-gpt-6-sol.jsonl | F08 | completed | False | False | 2 |
| api-features-gpt-6-sol.jsonl | F09 | completed | False | False | 2 |
| api-features-gpt-6-sol.jsonl | F10 | completed | False | False | 2 |
| api-features-gpt-6-sol.jsonl | F11 | completed | False | False | 4 |
| api-features-gpt-6-sol.jsonl | F12 | completed | False | False | 1 |
| api-round-1.jsonl | Q01 | completed | True | False | 2 |
| api-round-1.jsonl | Q02 | completed | True | False | 1 |
| api-round-1.jsonl | Q03 | completed | True | False | 0 |
| api-round-1.jsonl | Q04 | completed | True | False | 0 |
| api-round-1.jsonl | Q05 | completed | True | False | 0 |
| api-round-1.jsonl | Q06 | completed | False | False | 3 |
| api-round-1.jsonl | Q07 | completed | False | False | 2 |
| api-round-1.jsonl | Q08 | completed | False | False | 3 |
| api-round-1.jsonl | Q09 | completed | False | False | 3 |
| api-round-1.jsonl | Q10 | completed | False | False | 3 |
| api-round-1.jsonl | Q11 | completed | False | False | 3 |
| api-round-1.jsonl | Q12 | completed | False | False | 1 |
| api-round-1.jsonl | Q13 | completed | False | False | 3 |
| api-round-1.jsonl | Q14 | completed | False | False | 3 |
| api-round-1.jsonl | Q15 | completed | False | False | 3 |
| api-round-1.jsonl | Q16 | completed | False | False | 2 |
| api-round-1.jsonl | Q17 | completed | False | False | 1 |
| api-round-1.jsonl | Q18 | completed | False | False | 4 |
| api-round-1.jsonl | Q19 | completed | False | False | 4 |
| api-round-1.jsonl | Q20 | completed | False | False | 1 |
| api-round-1.jsonl | Q21 | completed | False | False | 1 |
| api-round-1.jsonl | Q22 | completed | False | False | 1 |
| api-round-1.jsonl | Q23 | completed | False | False | 1 |
| api-round-1.jsonl | Q24 | completed | False | False | 1 |
| api-round-1.jsonl | Q25 | completed | False | False | 2 |
| api-round-1.jsonl | Q26 | completed | False | False | 3 |
| api-round-1.jsonl | Q27 | completed | False | False | 2 |
| api-round-1.jsonl | Q28 | completed | False | False | 3 |
| api-round-1.jsonl | Q29 | completed | False | False | 3 |
| api-round-1.jsonl | Q30 | completed | False | False | 3 |
| api-selection-url.jsonl | D03 | completed | True | True | 3 |
| api-site-discovery-early.jsonl | D04 | completed | True | False | 2 |
| api-site-discovery-final.jsonl | D04 | completed | True | False | 2 |
| api-sol-round-1.jsonl | Q01 | completed | True | False | 1 |
| api-sol-round-1.jsonl | Q02 | completed | True | False | 5 |
| api-sol-round-1.jsonl | Q03 | completed | True | False | 1 |
| api-sol-round-1.jsonl | Q04 | completed | False | False | 2 |
| api-sol-round-1.jsonl | Q05 | completed | True | False | 2 |
| api-sol-round-1.jsonl | Q06 | completed | False | False | 3 |
| api-sol-round-1.jsonl | Q07 | completed | False | False | 3 |
| api-sol-round-1.jsonl | Q08 | completed | False | False | 3 |
| api-sol-round-1.jsonl | Q09 | completed | False | False | 4 |
| api-sol-round-1.jsonl | Q10 | completed | False | False | 3 |
| api-watch-1634-gpt-6-luna.jsonl | Q02 | completed | True | False | 1 |
| api-watch-1634-gpt-6-luna.jsonl | Q03 | completed | True | False | 1 |
| api-watch-1634-gpt-6-luna.jsonl | Q04 | completed | True | False | 0 |
| api-watch-1634-gpt-6-luna.jsonl | Q06 | completed | False | False | 3 |
| api-watch-1634-gpt-6-luna.jsonl | Q07 | completed | False | False | 2 |
| api-watch-1634-gpt-6-luna.jsonl | Q08 | completed | False | False | 3 |
| api-watch-1634-gpt-6-sol.jsonl | Q02 | completed | True | False | 2 |
| api-watch-1634-gpt-6-sol.jsonl | Q03 | completed | True | False | 1 |
| api-watch-1634-gpt-6-sol.jsonl | Q04 | completed | True | False | 1 |
| api-watch-1634-gpt-6-sol.jsonl | Q06 | completed | False | False | 3 |
| api-watch-1634-gpt-6-sol.jsonl | Q07 | completed | False | False | 3 |
| api-watch-1634-gpt-6-sol.jsonl | Q08 | completed | False | False | 3 |
| api-watch-1704-gpt-6-luna.jsonl | Q02 | completed | True | False | 1 |
| api-watch-1704-gpt-6-luna.jsonl | Q03 | completed | True | False | 1 |
| api-watch-1704-gpt-6-luna.jsonl | Q04 | completed | True | False | 0 |
| api-watch-1704-gpt-6-luna.jsonl | Q06 | completed | False | False | 3 |
| api-watch-1704-gpt-6-luna.jsonl | Q07 | completed | False | False | 3 |
| api-watch-1704-gpt-6-luna.jsonl | Q08 | completed | False | False | 3 |
| api-watch-1704-gpt-6-sol.jsonl | Q02 | completed | True | False | 3 |
| api-watch-1704-gpt-6-sol.jsonl | Q03 | completed | True | False | 1 |
| api-watch-1704-gpt-6-sol.jsonl | Q04 | completed | False | False | 1 |
| api-watch-1704-gpt-6-sol.jsonl | Q06 | completed | False | False | 4 |
| api-watch-1704-gpt-6-sol.jsonl | Q07 | completed | False | False | 3 |
| api-watch-1704-gpt-6-sol.jsonl | Q08 | completed | False | False | 4 |
| api-watch-1734-gpt-6-luna.jsonl | Q02 | completed | True | False | 2 |
| api-watch-1734-gpt-6-luna.jsonl | Q03 | completed | True | False | 1 |
| api-watch-1734-gpt-6-luna.jsonl | Q04 | completed | True | False | 0 |
| api-watch-1734-gpt-6-luna.jsonl | Q06 | completed | False | False | 2 |
| api-watch-1734-gpt-6-luna.jsonl | Q07 | completed | False | False | 3 |
| api-watch-1734-gpt-6-luna.jsonl | Q08 | completed | False | False | 4 |
| api-watch-1734-gpt-6-sol.jsonl | Q02 | completed | True | False | 3 |
| api-watch-1734-gpt-6-sol.jsonl | Q03 | completed | True | False | 1 |
| api-watch-1734-gpt-6-sol.jsonl | Q04 | completed | True | False | 1 |
| api-watch-1734-gpt-6-sol.jsonl | Q06 | completed | False | False | 4 |
| api-watch-1734-gpt-6-sol.jsonl | Q07 | completed | False | False | 3 |
| api-watch-1734-gpt-6-sol.jsonl | Q08 | completed | False | False | 4 |
| api-watch-1804-gpt-6-luna.jsonl | Q02 | completed | True | False | 1 |
| api-watch-1804-gpt-6-luna.jsonl | Q03 | completed | True | False | 1 |
| api-watch-1804-gpt-6-luna.jsonl | Q04 | completed | True | False | 0 |
| api-watch-1804-gpt-6-luna.jsonl | Q06 | completed | False | False | 3 |
| api-watch-1804-gpt-6-luna.jsonl | Q07 | completed | False | False | 2 |
| api-watch-1804-gpt-6-luna.jsonl | Q08 | completed | False | False | 3 |
| api-watch-1804-gpt-6-sol.jsonl | Q02 | completed | True | False | 3 |
| api-watch-1804-gpt-6-sol.jsonl | Q03 | completed | True | False | 1 |
| api-watch-1804-gpt-6-sol.jsonl | Q04 | completed | False | False | 1 |
| api-watch-1804-gpt-6-sol.jsonl | Q06 | completed | False | False | 4 |
| api-watch-1804-gpt-6-sol.jsonl | Q07 | completed | False | False | 3 |
| api-watch-1804-gpt-6-sol.jsonl | Q08 | completed | False | False | 3 |

오류·불완전 응답은 완료 답변의 분모에서 제외한다. 브랜드명 후보는 원문을 검토해 동명 서비스·일반 표현을 걸러야 한다.
질문별 원문, 실제 모델, 일시, 인용 URL, 검색 출처와 토큰 사용량은 입력 JSONL에 남아 있다.
