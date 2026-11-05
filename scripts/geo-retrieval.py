#!/usr/bin/env python3
"""Summarize exposed tool URLs separately from answer citations and name candidates."""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import json
import importlib.util
import re
from pathlib import Path
from urllib.parse import parse_qs, parse_qsl, urlencode, urlsplit, urlunsplit

_spec = importlib.util.spec_from_file_location('geo_mentions', Path(__file__).with_name('geo-mentions.py'))
_mentions = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mentions)


def kind(url):
    parsed = urlsplit(url)
    if parsed.hostname in ('deulli.com', 'www.deulli.com'):
        return 'official website'
    if parsed.hostname == 'apps.apple.com' and re.search(r'/id6798545609(?:/|$)', parsed.path):
        return 'official store listing'
    if parsed.hostname == 'play.google.com' and parse_qs(parsed.query).get('id') == ['com.deulli.app']:
        return 'official store listing'
    if parsed.hostname == 'deulli.policy.nangmans.com':
        return 'official policy site'
    return None


def citation_url(url):
    parsed = urlsplit(url)
    query = [(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True)
             if not k.lower().startswith('utm_') and k.lower() not in ('gclid', 'fbclid')]
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query), ''))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('files', nargs='+')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    groups = defaultdict(list)
    sources = defaultdict(Counter)
    details = []
    seen = set()
    for filename in args.files:
        path = Path(filename).resolve()
        if path in seen:
            continue
        seen.add(path)
        for line in path.read_text().splitlines():
            if not line.strip():
                continue
            row = json.loads(line)
            if row.get('status') != 'completed' or not row.get('answer'):
                continue
            direct = row.get('measurement_type') == 'direct_url_retrieval'
            cohort = 'direct URL diagnostic' if direct else 'brand prompted' if row['brand_prompted'] else 'non-brand discovery'
            exposed = set()
            for call in row.get('search_calls', []):
                action = call.get('action', {})
                if action.get('url'):
                    exposed.add(action['url'])
                exposed.update(s['url'] for s in action.get('sources', []) if s.get('url'))
            retrieved = sorted({kind(u) for u in exposed if kind(u)})
            cited = sorted({kind(c['url']) for c in row.get('citations', []) if kind(c['url'])})
            detail = dict(source_file=filename, question_id=row['question_id'], model=row['requested_model'],
                          cohort=cohort, exposed_own_url_kinds=retrieved, cited_own_url_kinds=cited,
                          name_candidate='deulli' in _mentions.candidates(row['answer']))
            groups[cohort].append(detail)
            details.append(detail)
            # At most one count per answer per URL; citations remain separate from tool-result URLs.
            for url in {citation_url(c['url']) for c in row.get('citations', [])}:
                sources[(cohort, row['category'])][url] += 1
    report = {'updated_at': datetime.now(timezone.utc).isoformat(),
              'method': 'Only URLs exposed in recorded tool actions/sources are observable; absence is not proof of absence from the provider index or hidden retrieval.',
              'groups': [], 'records': details,
              'citation_sources': [{'cohort': c, 'category': cat, 'urls': counter.most_common(20)}
                                   for (c, cat), counter in sorted(sources.items())]}
    lines = ['# 공개된 도구 URL·인용·이름 후보 관측', '', report['method'], '',
             '각 열은 같은 관측 집합의 답변 수다. 단계별 전환율이나 추천 성공률이 아니며, 서로 다른 질문·반복 관측을 포함한다.', '',
             '| 질문 구분 | 정상 답변 | 공식 웹 URL 기록 | 공식 스토어 URL 기록 | 정책 URL 기록 | 공식 웹 인용 | 이름 후보 |',
             '| --- | ---: | ---: | ---: | ---: | ---: | ---: |']
    for cohort, rows in sorted(groups.items()):
        item = dict(cohort=cohort, completed=len(rows),
                    exposed_website=sum('official website' in r['exposed_own_url_kinds'] for r in rows),
                    exposed_store=sum('official store listing' in r['exposed_own_url_kinds'] for r in rows),
                    exposed_policy=sum('official policy site' in r['exposed_own_url_kinds'] for r in rows),
                    cited_website=sum('official website' in r['cited_own_url_kinds'] for r in rows),
                    name_candidates=sum(r['name_candidate'] for r in rows))
        report['groups'].append(item)
        lines.append('| ' + ' | '.join(str(item[k]) for k in ['cohort','completed','exposed_website','exposed_store','exposed_policy','cited_website','name_candidates']) + ' |')
    lines += ['', 'URL 지정 진단에는 공식 주소를 제공했다. 해당 성공을 자연 발견·추천 또는 모델의 영구 학습으로 해석하지 않는다.',
              '스토어는 정확한 앱 ID와 제공자 도메인으로 판별한다. 제3자 APK 미러는 공식 스토어로 세지 않는다.', '',
              '## 비브랜드 답변의 인용 출처', '', 'URL별 횟수는 출처 후보를 조사하기 위한 값이며 순위·점유율이 아니다. UTM·클릭 추적 query만 제외하고 앱 ID 등 식별 query는 유지한다.']
    for item in report['citation_sources']:
        if item['cohort'] != 'non-brand discovery':
            continue
        lines += ['', '### '+item['category'], '']
        lines += [f'- {count}개 답변: {url}' for url, count in item['urls'][:10]]
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text('\n'.join(lines)+'\n')
    out.with_suffix('.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(f'Summarized {len(details)} completed answers into {out}')


if __name__ == '__main__':
    main()
