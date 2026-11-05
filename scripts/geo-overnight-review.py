#!/usr/bin/env python3
"""Review recorded discovery evidence until a user-specified UTC deadline."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys
import time
from urllib.parse import urlsplit


def review(destination, deadline, finished=False):
    paths = sorted(destination.glob('api-watch-*.jsonl'))
    rows = [json.loads(line) for path in paths for line in path.read_text().splitlines() if line.strip()]
    complete = [r for r in rows if r.get('status') == 'completed' and r.get('answer')]
    domains = Counter(urlsplit(c['url']).hostname for r in complete for c in r.get('citations', []))
    mentions = [r for r in complete if r.get('brand_mention_candidate')]
    official = [r for r in complete if r.get('official_domain_cited')]
    now = datetime.now(timezone.utc).isoformat()
    state = dict(updated_at=now, deadline_utc=deadline, status='finished' if finished else 'running',
                 recorded=len(rows), completed=len(complete), errors=len(rows)-len(complete),
                 brand_candidates=len(mentions), official_website_citations=len(official),
                 expected_observations=96, observed_files=[p.name for p in paths])
    target = destination / 'overnight-state.json'
    temp = target.with_suffix('.tmp')
    temp.write_text(json.dumps(state, ensure_ascii=False, indent=2)+'\n'); temp.replace(target)
    lines = ['# 오전 11시까지 GEO 후속 관측', '',
             f'마지막 집계 UTC: {now}', f'종료 기준 UTC: {deadline}',
             f'실행 상태: {state["status"]}', '',
             '사용자가 지정한 영어공부 앱·공부법·팟캐스트 추천을 포함한 비브랜드 질문 6개를 두 모델에서 매시간 독립 실행한다. '
             'Vercel 로그인·배포는 제외했다. API 관측이며 소비자용 화면 측정과 구분한다.', '',
             f'- 계획 관측: 96개 / 현재 기록: {len(rows)}개 / 정상 답변: {len(complete)}개 / 오류·불완전: {len(rows)-len(complete)}개',
             f'- 들리 이름 후보: {len(mentions)}개 / 공식 홈페이지 인용: {len(official)}개',
             '- 이름 후보 출현은 정확한 식별이나 추천 성공을 의미하지 않는다. 실제 추천 여부는 답변 원문에서 확인해야 한다.', '',
             '## 인용 도메인 빈도', '', '| 도메인 | 인용 수 |', '| --- | ---: |']
    lines += [f'| {domain} | {count} |' for domain, count in domains.most_common(25)]
    lines += ['', '빈도는 답변 인용 수이며 시장 점유율·검색 순위·품질 점수가 아니다. '
              'URL을 모델에 알려주거나 반복 질문하는 행위가 모델 학습 또는 영구 노출을 보장하지 않는다.', '',
              '## 들리 후보가 나온 답변', '']
    lines += [f'- {r["observed_at"]} / {r["requested_model"]} / {r["question_id"]}: 원문 JSONL 확인 필요' for r in mentions]
    if not mentions:
        lines += ['현재까지 없음.']
    if finished and len(rows) < 96:
        lines += ['', '**계획 수보다 적은 관측이다. 누락·오류를 성공한 실행으로 처리하지 않는다.**']
    (destination/'overnight-results.md').write_text('\n'.join(lines)+'\n')
    if paths:
        subprocess.run([sys.executable, 'scripts/geo-report.py', *map(str, paths), '--output', str(destination/'api-summary.md')], check=True)
    if paths:
        baseline = sorted(destination.parent.glob('api-*.jsonl')) + sorted((destination.parent/'watch').glob('api-*.jsonl'))
        subprocess.run([sys.executable, 'scripts/geo-mentions.py', *map(str, baseline+paths),
                        '--output', str(destination/'visible-name-candidates.md')], check=True)
    print(f'Review {now}: {len(complete)}/{len(rows)} completed, brand candidates={len(mentions)}, official={len(official)}', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--deadline-utc', required=True)
    args = parser.parse_args()
    deadline = datetime.fromisoformat(args.deadline_utc.replace('Z', '+00:00'))
    remaining = deadline.timestamp()-time.time()
    if not 0 < remaining <= 12*3600:
        raise ValueError('Deadline must be in the next 12 hours')
    destination = Path(args.output_dir); destination.mkdir(parents=True, exist_ok=True)
    while time.time() < deadline.timestamp():
        review(destination, args.deadline_utc)
        next_review = min(deadline.timestamp(), time.time()+30*60)
        while time.time() < next_review:
            time.sleep(min(10, next_review-time.time()))
    review(destination, args.deadline_utc, finished=True)
    print('User-specified 11:00 KST deadline reached; review saved', flush=True)


if __name__ == '__main__':
    main()
