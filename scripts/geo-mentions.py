#!/usr/bin/env python3
"""Count visible product-name candidates without equating them with recommendations."""
import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
import re

ENTITIES = {
    'deulli': ('app', r'deulli|(?<![가-힣])들리(?![가-힣])'),
    'Speak': ('app', r'(?<!ELSA )\bSpeak\b|(?<!엘사 )(?<!엘사)스픽(?![가-힣])'),
    'ELSA Speak': ('app', r'\bELSA\b|엘사\s*스픽'),
    'Duolingo': ('app', r'\bDuolingo\b|듀오링고'),
    'LingQ': ('app', r'\bLingQ\b|링큐'),
    'VoiceTube': ('app', r'\bVoiceTube\b|보이스튜브'),
    'Cake': ('app', r'\bCake\b|케이크'),
    'HelloTalk': ('app', r'\bHelloTalk\b|헬로우?톡'),
    'Quizlet': ('app', r'\bQuizlet\b|퀴즐렛'),
    'Anki': ('app', r'\bAnki\b|안키|앙키'),
    'Podling': ('app', r'\bPodling\b|팟링|포들링'),
    'Lingoreel': ('app', r'\bLingoreel\b|링고릴'),
    'PlayLingo': ('app', r'\bPlayLingo\b|플레이라?링고'),
    'Parroto Podcast': ('app', r'Parroto(?: Podcast)?|패로토'),
    'Rehear': ('app', r'\bRehear\b|리히어'),
    'Unpack': ('app', r'\bUnpack\b'),
    'Huh Understand Podcasts': ('app', r'Huh:\s*Understand Podcasts'),
    'AcrossCast': ('app', r'\bAcrossCast\b'),
    'LemonCast': ('app', r'\bLemonCast\b|레몬캐스트'),
    'NotebookLM': ('app', r'\bNotebookLM\b|노트북\s*엘엠'),
    'ElevenReader': ('app', r'\bElevenReader\b'),
    'Apple Podcasts': ('player', r'Apple (?:Podcasts|팟캐스트)|애플\s*팟캐스트'),
    'Spotify': ('player', r'\bSpotify\b|스포티파이'),
    'BBC': ('content/provider', r'\bBBC\b'),
    'British Council': ('content/provider', r'British Council|브리티시\s*카운슬|영국문화원'),
    'VOA': ('content/provider', r'\bVOA\b'),
    'All Ears English': ('content/provider', r'All Ears English|올\s*이어스\s*잉글리시'),
}


def visible(text):
    def link(match):
        label = match.group(1)
        return '' if re.fullmatch(r'[\w.-]+\.[a-z]{2,}', label, re.I) else label
    text = re.sub(r'\[([^\]]+)\]\([^\s)]+\)', link, text)
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'[*_`]', '', text)
    return re.sub(r'\s+', ' ', text)


def candidates(answer):
    text = visible(answer)
    result = []
    for name, (_, pattern) in ENTITIES.items():
        probe = re.sub(r'ELSA\s+Speak|엘사\s*스픽', '', text, flags=re.I) if name == 'Speak' else text
        if re.search(pattern, probe, 0 if name in ('Speak', 'Unpack') else re.I):
            result.append(name)
    return result


def intent(record):
    broad = {'G01': 'general app choice', 'G04': 'general app choice',
             'G02': 'general study methods', 'G05': 'general study methods',
             'G06': 'general study methods', 'G03': 'podcast content choice',
             'G07': 'listening app choice', 'G08': 'shadowing methods',
             'G09': 'commute study methods'}
    return broad.get(record['question_id'], record.get('category', 'other'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('files', nargs='+')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    groups = defaultdict(list)
    for name in args.files:
        for line in Path(name).read_text().splitlines():
            if not line.strip():
                continue
            record = json.loads(line)
            if record.get('brand_prompted') or record.get('status') != 'completed' or not record.get('answer'):
                continue
            cohort = 'overnight' if 'overnight-2026-11-06' in Path(name).parts else 'initial-and-two-hour'
            record = dict(record, source_file=name, candidates=candidates(record['answer']))
            groups[(cohort, record['requested_model'])].append(record)
    lines = ['# Non-brand visible name candidates', '',
             'Counts are mentions in answer text, not recommendations, preference, ranking, market share or causal GEO lift. '
             'Content providers are separate from apps. URL-only labels are excluded. Repeated questions and models are not statistically independent samples.', '',
             '| Cohort | Model | Type | Name | Answers with candidate | Eligible answers |',
             '| --- | --- | --- | --- | ---: | ---: |']
    data = []
    for (cohort, model), rows in sorted(groups.items()):
        for entity, (kind, _) in ENTITIES.items():
            matches = [r for r in rows if entity in r['candidates']]
            item = dict(cohort=cohort, model=model, type=kind, name=entity, candidate_answers=len(matches),
                        eligible_answers=len(rows), evidence=[dict(file=r['source_file'], question_id=r['question_id'],
                                                                  observed_at=r['observed_at']) for r in matches])
            data.append(item)
            lines.append(f'| {cohort} | {model} | {kind} | {entity} | {len(matches)} | {len(rows)} |')
    intents = defaultdict(list)
    for rows in groups.values():
        for record in rows:
            intents[intent(record)].append(record)
    lines += ['', '## Intent-specific candidates', '',
              '| Intent | Eligible answers | deulli candidates | Frequent apps/players | Frequent content/providers |',
              '| --- | ---: | ---: | --- | --- |']
    for label, rows in sorted(intents.items()):
        counts = Counter(name for record in rows for name in record['candidates'])
        apps = ', '.join(f'{name} ({count})' for name, count in counts.most_common()
                         if ENTITIES[name][0] in ('app', 'player'))
        providers = ', '.join(f'{name} ({count})' for name, count in counts.most_common()
                              if ENTITIES[name][0] == 'content/provider')
        lines.append(f'| {label} | {len(rows)} | {counts["deulli"]} | {apps or "none"} | {providers or "none"} |')
    target = Path(args.output)
    target.write_text('\n'.join(lines)+'\n')
    target.with_suffix('.json').write_text(json.dumps(dict(method='Visible-name candidates; manually review recommendation role', results=data), ensure_ascii=False, indent=2)+'\n')
    print(f'Counted {sum(len(r) for r in groups.values())} non-brand answers across {len(groups)} model/cohort groups')


if __name__ == '__main__':
    main()
