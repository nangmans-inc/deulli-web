# 04:30 KST 관측 원문 검토

6개 비브랜드 질문 × 두 모델 = 12개 정상 답변. 첫 야간 회차와 합계 24개. 들리의 이름·공식 웹 인용은 이번에도 없었다. 기존 관측을 포함한 전체 API 기록은 URL 지정 Play 진단 2개를 더해 170개이며, 비브랜드 답변은 120개다.

## 질문 의도별 실제 후보

| 질문 | Luna | Sol |
| --- | --- | --- |
| G01 영어공부 앱 | Speak, Cake, ELSA | Duolingo, Speak, ELSA |
| G02 영어공부 방법 | 루틴·목적별 안내, 특정 앱 추천 없음 | 루틴·목적별 안내, 특정 앱 추천 없음 |
| G03 팟캐스트 추천 | BBC 6 Minute English, VOA, All Ears English | VOA, BBC 6 Minute English, Easy English |
| G07 리스닝 앱 | Cake, BBC, British Council | BBC, TED, ELSA |
| G08 쉐도잉 방법 | 단계별 연습, 특정 앱 추천 없음 | 단계별 연습, 특정 앱 추천 없음 |
| G09 출퇴근 공부 | British Council, VOA | British Council |

후보는 원문을 읽고 구분한 것이며, 첫 번째 항목을 검색 순위로 표현하지 않는다. G02·G08처럼 앱을 직접 추천하지 않은 답변도 정상적인 방법 안내다. 상품명이 나오지 않았다는 이유만으로 오답으로 분류하지 않는다.

## 출처 확인

- Luna G07의 BBC 설명에는 첫 회차와 마찬가지로 British Council 앱 페이지가 붙었다. 제공자 불일치가 반복됐으므로 BBC 기능의 확인 근거로 사용하지 않는다.
- Sol G07의 [TED 대본 안내](https://help.ted.com/hc/en-us/articles/360018572954-How-do-I-find-transcripts-for-TED-and-TEDx-talks)는 현재 Mobile devices 절에서 앱의 ‘Read transcript’ 버튼과 구간별 스크롤을 설명한다. 웹 기능만 소개하는 페이지라고 기억에 의존해 반박하지 않았다. ‘제공되는 경우’와 언어별 제공 조건은 남아 있다. 실제 앱을 설치해 확인한 것은 아니다.
- Sol G02가 인용한 [British Council comment URL](https://learnenglish.britishcouncil.org/comment/206115)은 사용자 댓글만 있는 화면이 아니라 학습 계획 본문과 토론 영역을 함께 제공했다. URL에 `comment`가 있다는 이유만으로 출처 전체를 사용자 의견으로 분류하지 않았다.
- Luna G08의 [British Council 쉐도잉 활동](https://africa.teachingenglish.org.uk/classroom/pronunciation/shadowing)은 짧고 이해할 수 있는 음성·리듬과 억양·녹음 비교를 설명한다. 교사용 활동 안내이며 앱 학습 효과의 실험적 입증 자료로 쓰지 않는다.

## 공개 상태 변화

같은 회차 HTTP 점검에서 `/guides/starting-english-study/`가 200으로 확인됐다. 새 draft의 `/guides/english-study-apps/`는 404였다. 실제 공개된 시작법 URL 한 개에 대해서만 소유 키와 canonical을 검증한 뒤 IndexNow 제출 HTTP 200을 받았다. 영수증은 `indexnow-starting-guide.json`에 보존했다. 제출 수락은 색인·AI 추천의 증거가 아니다. 배포 서비스 로그인이나 배포 작업은 하지 않았다.

GSC에서는 기존 사이트맵 탭에 성공·발견 페이지 0이 표시됐으나, 최신 상태로 새로고침한 뒤 본문이 표시되지 않았다. 시작법 가이드의 GSC URL 검사·색인 요청은 실행하지 못했다. 이전의 다른 5개 URL 요청 성공과 혼동하지 않는다.

이 검토는 에이전트가 답변·출처의 대응을 점검한 기록이다. 독립적인 사람의 앱 사용 검증이나 체계적 품질 평가는 아니다.
