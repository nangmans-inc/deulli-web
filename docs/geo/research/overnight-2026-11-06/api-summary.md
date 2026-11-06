# API 답변 관측 집계

검색을 사용한 독립 API 요청이다. 소비자용 ChatGPT 결과나 GEO 작업의 인과 효과를 뜻하지 않는다.

브랜드명 후보 출현은 추천 여부나 올바른 제품 식별과 다르다. 공식 스토어 인용과 공식 도메인 인용도 따로 센다.

| 모델 | 질문 구분 | 요청 | 완료 답변 | 검색 실행 | 브랜드명 후보 | 공식 웹 인용 | 공식 스토어 인용 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| gpt-6-luna | 넓은 영어공부 의도 | 48 | 47 | 47 | 0 | 0 | 0 |
| gpt-6-sol | 넓은 영어공부 의도 | 48 | 48 | 48 | 0 | 0 | 0 |

## 인용 도메인

- learnenglish.britishcouncil.org: 73회
- learningenglish.voanews.com: 24회
- africa.teachingenglish.org.uk: 14회
- podcasts.apple.com: 13회
- elsaspeak.com: 11회
- downloads.bbc.co.uk: 11회
- blog.elsaspeak.com: 11회
- play.google.com: 8회
- takeielts.britishcouncil.org: 8회
- www.speak.com: 6회
- www.britishcouncil.org: 6회
- www.duolingo.com: 5회
- www.lingq.com: 5회
- www.bbclearningenglish.org: 4회
- blog.duolingo.com: 4회
- www.voicetube.com: 4회
- www.hellotalk.com: 4회
- feeds.bbci.co.uk: 4회
- ko.duolingo.com: 4회
- www.youtube.com: 3회

## 질문별 확인 위치

| 파일 | 질문 | 상태 | 브랜드명 후보 | 공식 웹 인용 | 인용 수 |
| --- | --- | --- | --- | --- | ---: |
| api-watch-0030-gpt-6-luna.jsonl | G01 | completed | False | False | 3 |
| api-watch-0030-gpt-6-luna.jsonl | G02 | completed | False | False | 1 |
| api-watch-0030-gpt-6-luna.jsonl | G03 | completed | False | False | 3 |
| api-watch-0030-gpt-6-luna.jsonl | G07 | completed | False | False | 3 |
| api-watch-0030-gpt-6-luna.jsonl | G08 | completed | False | False | 2 |
| api-watch-0030-gpt-6-luna.jsonl | G09 | completed | False | False | 1 |
| api-watch-0030-gpt-6-sol.jsonl | G01 | completed | False | False | 3 |
| api-watch-0030-gpt-6-sol.jsonl | G02 | completed | False | False | 4 |
| api-watch-0030-gpt-6-sol.jsonl | G03 | completed | False | False | 4 |
| api-watch-0030-gpt-6-sol.jsonl | G07 | completed | False | False | 3 |
| api-watch-0030-gpt-6-sol.jsonl | G08 | completed | False | False | 4 |
| api-watch-0030-gpt-6-sol.jsonl | G09 | completed | False | False | 2 |
| api-watch-0130-gpt-6-luna.jsonl | G01 | completed | False | False | 3 |
| api-watch-0130-gpt-6-luna.jsonl | G02 | completed | False | False | 2 |
| api-watch-0130-gpt-6-luna.jsonl | G03 | completed | False | False | 4 |
| api-watch-0130-gpt-6-luna.jsonl | G07 | http_error | False | False | 0 |
| api-watch-0130-gpt-6-luna.jsonl | G08 | completed | False | False | 3 |
| api-watch-0130-gpt-6-luna.jsonl | G09 | completed | False | False | 2 |
| api-watch-0130-gpt-6-sol.jsonl | G01 | completed | False | False | 3 |
| api-watch-0130-gpt-6-sol.jsonl | G02 | completed | False | False | 4 |
| api-watch-0130-gpt-6-sol.jsonl | G03 | completed | False | False | 3 |
| api-watch-0130-gpt-6-sol.jsonl | G07 | completed | False | False | 4 |
| api-watch-0130-gpt-6-sol.jsonl | G08 | completed | False | False | 4 |
| api-watch-0130-gpt-6-sol.jsonl | G09 | completed | False | False | 2 |
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
| api-watch-1930-gpt-6-luna.jsonl | G01 | completed | False | False | 3 |
| api-watch-1930-gpt-6-luna.jsonl | G02 | completed | False | False | 1 |
| api-watch-1930-gpt-6-luna.jsonl | G03 | completed | False | False | 3 |
| api-watch-1930-gpt-6-luna.jsonl | G07 | completed | False | False | 2 |
| api-watch-1930-gpt-6-luna.jsonl | G08 | completed | False | False | 2 |
| api-watch-1930-gpt-6-luna.jsonl | G09 | completed | False | False | 2 |
| api-watch-1930-gpt-6-sol.jsonl | G01 | completed | False | False | 3 |
| api-watch-1930-gpt-6-sol.jsonl | G02 | completed | False | False | 2 |
| api-watch-1930-gpt-6-sol.jsonl | G03 | completed | False | False | 3 |
| api-watch-1930-gpt-6-sol.jsonl | G07 | completed | False | False | 3 |
| api-watch-1930-gpt-6-sol.jsonl | G08 | completed | False | False | 4 |
| api-watch-1930-gpt-6-sol.jsonl | G09 | completed | False | False | 1 |
| api-watch-2030-gpt-6-luna.jsonl | G01 | completed | False | False | 3 |
| api-watch-2030-gpt-6-luna.jsonl | G02 | completed | False | False | 2 |
| api-watch-2030-gpt-6-luna.jsonl | G03 | completed | False | False | 3 |
| api-watch-2030-gpt-6-luna.jsonl | G07 | completed | False | False | 3 |
| api-watch-2030-gpt-6-luna.jsonl | G08 | completed | False | False | 2 |
| api-watch-2030-gpt-6-luna.jsonl | G09 | completed | False | False | 2 |
| api-watch-2030-gpt-6-sol.jsonl | G01 | completed | False | False | 3 |
| api-watch-2030-gpt-6-sol.jsonl | G02 | completed | False | False | 3 |
| api-watch-2030-gpt-6-sol.jsonl | G03 | completed | False | False | 3 |
| api-watch-2030-gpt-6-sol.jsonl | G07 | completed | False | False | 3 |
| api-watch-2030-gpt-6-sol.jsonl | G08 | completed | False | False | 3 |
| api-watch-2030-gpt-6-sol.jsonl | G09 | completed | False | False | 2 |
| api-watch-2130-gpt-6-luna.jsonl | G01 | completed | False | False | 3 |
| api-watch-2130-gpt-6-luna.jsonl | G02 | completed | False | False | 1 |
| api-watch-2130-gpt-6-luna.jsonl | G03 | completed | False | False | 3 |
| api-watch-2130-gpt-6-luna.jsonl | G07 | completed | False | False | 2 |
| api-watch-2130-gpt-6-luna.jsonl | G08 | completed | False | False | 2 |
| api-watch-2130-gpt-6-luna.jsonl | G09 | completed | False | False | 2 |
| api-watch-2130-gpt-6-sol.jsonl | G01 | completed | False | False | 4 |
| api-watch-2130-gpt-6-sol.jsonl | G02 | completed | False | False | 3 |
| api-watch-2130-gpt-6-sol.jsonl | G03 | completed | False | False | 3 |
| api-watch-2130-gpt-6-sol.jsonl | G07 | completed | False | False | 4 |
| api-watch-2130-gpt-6-sol.jsonl | G08 | completed | False | False | 4 |
| api-watch-2130-gpt-6-sol.jsonl | G09 | completed | False | False | 2 |
| api-watch-2230-gpt-6-luna.jsonl | G01 | completed | False | False | 3 |
| api-watch-2230-gpt-6-luna.jsonl | G02 | completed | False | False | 1 |
| api-watch-2230-gpt-6-luna.jsonl | G03 | completed | False | False | 3 |
| api-watch-2230-gpt-6-luna.jsonl | G07 | completed | False | False | 3 |
| api-watch-2230-gpt-6-luna.jsonl | G08 | completed | False | False | 1 |
| api-watch-2230-gpt-6-luna.jsonl | G09 | completed | False | False | 2 |
| api-watch-2230-gpt-6-sol.jsonl | G01 | completed | False | False | 3 |
| api-watch-2230-gpt-6-sol.jsonl | G02 | completed | False | False | 4 |
| api-watch-2230-gpt-6-sol.jsonl | G03 | completed | False | False | 4 |
| api-watch-2230-gpt-6-sol.jsonl | G07 | completed | False | False | 3 |
| api-watch-2230-gpt-6-sol.jsonl | G08 | completed | False | False | 4 |
| api-watch-2230-gpt-6-sol.jsonl | G09 | completed | False | False | 3 |
| api-watch-2330-gpt-6-luna.jsonl | G01 | completed | False | False | 3 |
| api-watch-2330-gpt-6-luna.jsonl | G02 | completed | False | False | 3 |
| api-watch-2330-gpt-6-luna.jsonl | G03 | completed | False | False | 3 |
| api-watch-2330-gpt-6-luna.jsonl | G07 | completed | False | False | 4 |
| api-watch-2330-gpt-6-luna.jsonl | G08 | completed | False | False | 2 |
| api-watch-2330-gpt-6-luna.jsonl | G09 | completed | False | False | 2 |
| api-watch-2330-gpt-6-sol.jsonl | G01 | completed | False | False | 4 |
| api-watch-2330-gpt-6-sol.jsonl | G02 | completed | False | False | 4 |
| api-watch-2330-gpt-6-sol.jsonl | G03 | completed | False | False | 3 |
| api-watch-2330-gpt-6-sol.jsonl | G07 | completed | False | False | 4 |
| api-watch-2330-gpt-6-sol.jsonl | G08 | completed | False | False | 4 |
| api-watch-2330-gpt-6-sol.jsonl | G09 | completed | False | False | 3 |

오류·불완전 응답은 완료 답변의 분모에서 제외한다. 브랜드명 후보는 원문을 검토해 동명 서비스·일반 표현을 걸러야 한다.
질문별 원문, 실제 모델, 일시, 인용 URL, 검색 출처와 토큰 사용량은 입력 JSONL에 남아 있다.
