# API 답변 관측 집계

검색을 사용한 독립 API 요청이다. 소비자용 ChatGPT 결과나 GEO 작업의 인과 효과를 뜻하지 않는다.

브랜드명 후보 출현은 추천 여부나 올바른 제품 식별과 다르다. 공식 스토어 인용과 공식 도메인 인용도 따로 센다.

| 모델 | 질문 구분 | 요청 | 완료 답변 | 검색 실행 | 브랜드명 후보 | 공식 웹 인용 | 공식 스토어 인용 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| gpt-6-luna | 비브랜드 | 25 | 25 | 25 | 0 | 0 | 0 |
| gpt-6-luna | 브랜드 포함 | 5 | 5 | 5 | 5 | 0 | 1 |
| gpt-6-sol | URL 지정 진단 | 2 | 2 | 2 | 2 | 2 | 0 |
| gpt-6-sol | 비브랜드 | 5 | 5 | 5 | 0 | 0 | 0 |
| gpt-6-sol | 브랜드 포함 | 5 | 5 | 5 | 4 | 0 | 5 |

## 인용 도메인

- apps.apple.com: 15회
- www.lingoreel.com: 12회
- trypodling.com: 8회
- playlingo.app: 5회
- play.google.com: 5회
- rehearapp.com: 4회
- learnenglish.britishcouncil.org: 4회
- deulli.com: 4회
- www.britishcouncil.kr: 3회
- podcast.parroto.app: 3회
- www.apple.com: 2회
- support.apple.com: 2회
- support.google.com: 2회
- support.spotify.com: 2회
- zdnet.co.kr: 1회
- deulli.de: 1회
- flaudio.app: 1회
- podtext.ai: 1회
- explore.microsoft.com: 1회
- www.unpack.fm: 1회

## 질문별 확인 위치

| 파일 | 질문 | 상태 | 브랜드명 후보 | 공식 웹 인용 | 인용 수 |
| --- | --- | --- | --- | --- | ---: |
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
| api-direct-url.jsonl | D01 | completed | True | True | 2 |
| api-direct-url.jsonl | D02 | completed | True | True | 2 |
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

오류·불완전 응답은 완료 답변의 분모에서 제외한다. 브랜드명 후보는 원문을 검토해 동명 서비스·일반 표현을 걸러야 한다.
질문별 원문, 실제 모델, 일시, 인용 URL, 검색 출처와 토큰 사용량은 입력 JSONL에 남아 있다.
