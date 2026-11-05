# API 답변 관측 집계

검색을 사용한 독립 API 요청이다. 소비자용 ChatGPT 결과나 GEO 작업의 인과 효과를 뜻하지 않는다.

브랜드명 후보 출현은 추천 여부나 올바른 제품 식별과 다르다. 공식 스토어 인용과 공식 도메인 인용도 따로 센다.

| 모델 | 질문 구분 | 요청 | 완료 답변 | 검색 실행 | 브랜드명 후보 | 공식 웹 인용 | 공식 스토어 인용 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| gpt-6-luna | 넓은 영어공부 의도 | 6 | 6 | 6 | 0 | 0 | 0 |
| gpt-6-sol | 넓은 영어공부 의도 | 6 | 6 | 6 | 0 | 0 | 0 |

## 인용 도메인

- learnenglish.britishcouncil.org: 9회
- learningenglish.voanews.com: 3회
- www.speak.com: 2회
- www.lingq.com: 2회
- elsaspeak.com: 2회
- www.duolingo.com: 1회
- feeds.bbci.co.uk: 1회
- podcasts.apple.com: 1회
- www.britishcouncil.org: 1회
- blog.elsaspeak.com: 1회
- ko.duolingo.com: 1회
- quizlet.com: 1회
- downloads.bbc.co.uk: 1회
- www.eslpod.com: 1회
- www.voicetube.com: 1회
- africa.teachingenglish.org.uk: 1회
- doi.org: 1회
- www.cdc.gov: 1회

## 질문별 확인 위치

| 파일 | 질문 | 상태 | 브랜드명 후보 | 공식 웹 인용 | 인용 수 |
| --- | --- | --- | --- | --- | ---: |
| api-watch-1830-gpt-6-luna.jsonl | G01 | completed | False | False | 2 |
| api-watch-1830-gpt-6-luna.jsonl | G02 | completed | False | False | 1 |
| api-watch-1830-gpt-6-luna.jsonl | G03 | completed | False | False | 3 |
| api-watch-1830-gpt-6-luna.jsonl | G07 | completed | False | False | 3 |
| api-watch-1830-gpt-6-luna.jsonl | G08 | completed | False | False | 2 |
| api-watch-1830-gpt-6-luna.jsonl | G09 | completed | False | False | 2 |
| api-watch-1830-gpt-6-sol.jsonl | G01 | completed | False | False | 4 |
| api-watch-1830-gpt-6-sol.jsonl | G02 | completed | False | False | 3 |
| api-watch-1830-gpt-6-sol.jsonl | G03 | completed | False | False | 4 |
| api-watch-1830-gpt-6-sol.jsonl | G07 | completed | False | False | 3 |
| api-watch-1830-gpt-6-sol.jsonl | G08 | completed | False | False | 2 |
| api-watch-1830-gpt-6-sol.jsonl | G09 | completed | False | False | 2 |

오류·불완전 응답은 완료 답변의 분모에서 제외한다. 브랜드명 후보는 원문을 검토해 동명 서비스·일반 표현을 걸러야 한다.
질문별 원문, 실제 모델, 일시, 인용 URL, 검색 출처와 토큰 사용량은 입력 JSONL에 남아 있다.
