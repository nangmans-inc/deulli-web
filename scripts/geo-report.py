#!/usr/bin/env python3
"""Summarize recorded API observations without treating mentions as recommendations."""
import argparse
from collections import Counter, defaultdict
import json
import re
from pathlib import Path
import urllib.parse


def is_store(url):
    parts = urllib.parse.urlsplit(url)
    return (parts.hostname == 'apps.apple.com' and '/id6798545609' in parts.path) or (
        parts.hostname == 'play.google.com' and
        urllib.parse.parse_qs(parts.query).get('id') == ['com.deulli.app'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('files', nargs='+')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    records = []
    for name in args.files:
        for line in Path(name).read_text().splitlines():
            if line.strip():
                record = json.loads(line)
                record['brand_mention_candidate'] = bool(re.search(
                    r'deulli|(?<![가-힣])들리(?![가-힣])', record.get('answer', ''), re.I))
                record['run_file'] = name
                records.append(record)
    groups = defaultdict(list)
    for record in records:
        groups[(record['requested_model'], ('broad_intent' if record.get('category') == 'broad_intent' else record.get('measurement_type', 'discovery')), record['brand_prompted'])].append(record)
    lines = ['# API 답변 관측 집계', '',
             '검색을 사용한 독립 API 요청이다. 소비자용 ChatGPT 결과나 GEO 작업의 인과 효과를 뜻하지 않는다.', '',
             '브랜드명 후보 출현은 추천 여부나 올바른 제품 식별과 다르다. 공식 스토어 인용과 공식 도메인 인용도 따로 센다.', '',
             '| 모델 | 질문 구분 | 요청 | 완료 답변 | 검색 실행 | 브랜드명 후보 | 공식 웹 인용 | 공식 스토어 인용 |',
             '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |']
    for (model, measurement_type, branded), rows in sorted(groups.items()):
        valid = [r for r in rows if r['status'] == 'completed' and r.get('answer')]
        search = [r for r in valid if any(c.get('status') == 'completed' for c in r.get('search_calls', []))]
        store = sum(any(is_store(c['url']) for c in r.get('citations', [])) for r in valid)
        label = {'direct_url_retrieval': 'URL 지정 진단',
                 'brand_site_discovery': '공식 홈페이지 찾기',
                 'brand_context': '제품명·분야 명시',
                 'feature_derived': '제품 기능 기반 탐색',
                 'broad_intent': '넓은 영어공부 의도'}.get(
                     measurement_type, '브랜드 포함' if branded else '비브랜드')
        lines.append(f'| {model} | {label} | {len(rows)} | {len(valid)} | {len(search)} | '
                     f'{sum(r.get("brand_mention_candidate", False) for r in valid)} | '
                     f'{sum(r.get("official_domain_cited", False) for r in valid)} | {store} |')
    lines.extend(['', '## 인용 도메인', ''])
    domains = Counter(urllib.parse.urlsplit(c['url']).hostname for r in records
                      if r['status'] == 'completed' for c in r.get('citations', []))
    lines.extend(f'- {host}: {count}회' for host, count in domains.most_common(20))
    lines.extend(['', '## 질문별 확인 위치', '',
                  '| 파일 | 질문 | 상태 | 브랜드명 후보 | 공식 웹 인용 | 인용 수 |',
                  '| --- | --- | --- | --- | --- | ---: |'])
    for record in records:
        lines.append(f'| {Path(record["run_file"]).name} | {record["question_id"]} | {record["status"]} | '
                     f'{record.get("brand_mention_candidate", "미측정")} | '
                     f'{record.get("official_domain_cited", "미측정")} | {len(record.get("citations", []))} |')
    lines.extend(['', '오류·불완전 응답은 완료 답변의 분모에서 제외한다. 브랜드명 후보는 원문을 검토해 동명 서비스·일반 표현을 걸러야 한다.',
                  '질문별 원문, 실제 모델, 일시, 인용 URL, 검색 출처와 토큰 사용량은 입력 JSONL에 남아 있다.', ''])
    Path(args.output).write_text('\n'.join(lines))
    print(f'Summarized {len(records)} observations to {args.output}')


if __name__ == '__main__':
    main()
