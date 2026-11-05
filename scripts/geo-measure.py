#!/usr/bin/env python3
"""Measure independent web-grounded API answers; never submit product copy as context."""
import argparse
import datetime
import json
import os
from pathlib import Path
import re
import time
import urllib.error
import urllib.parse
import urllib.request


def key_from_file(path):
    for line in Path(path).read_text().splitlines():
        name, _, value = line.partition('=')
        if name.strip() == 'OPENAI_API_KEY':
            return value.strip().strip('\"\'')
    raise ValueError('OPENAI_API_KEY not found in supplied file')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--env-file', help='Read only OPENAI_API_KEY; never persisted')
    parser.add_argument('--ids', default='Q01,Q06,Q07,Q08,Q09,Q10')
    parser.add_argument('--model', default='gpt-6-luna')
    parser.add_argument('--questions', default='docs/geo/questions.json')
    parser.add_argument('--repeat', type=int, default=1)
    parser.add_argument('--output', required=True)
    parser.add_argument('--run', action='store_true', help='Make billable API requests')
    args = parser.parse_args()
    ids = args.ids.split(',')
    questions = json.loads(Path(args.questions).read_text())
    selected = [q for q in questions if q['id'] in ids]
    if len(selected) != len(set(ids)) or not 1 <= args.repeat <= 3 or len(selected) > 30:
        raise ValueError('Expected known IDs, at most 30 questions and 1-3 repeats')
    if not args.run:
        print(f'Plan: {len(selected) * args.repeat} independent requests, model={args.model}; no API calls made')
        return
    target = Path(args.output)
    if target.exists():
        raise ValueError('Output already exists; choose a fresh run path')
    key = key_from_file(args.env_file) if args.env_file else os.environ['OPENAI_API_KEY']
    target.parent.mkdir(parents=True, exist_ok=True)
    for repeat in range(1, args.repeat + 1):
        for question in selected:
            payload = {'model': args.model, 'store': False,
                       'instructions': '한국어로 간결하게 답하고 웹 출처를 인용하세요.',
                       'input': question['prompt'],
                       'tools': [{'type': 'web_search', 'search_context_size': 'medium',
                                  'user_location': {'type': 'approximate', 'country': 'KR'}}],
                       'tool_choice': 'required', 'max_tool_calls': 3,
                       'reasoning': {'effort': 'low'}, 'max_output_tokens': 2400,
                       'include': ['web_search_call.action.sources']}
            record = {'observed_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                      'provider': 'OpenAI Responses API', 'requested_model': args.model,
                      'question_id': question['id'], 'category': question['category'],
                      'brand_prompted': question['brand_prompted'], 'prompt': question['prompt'],
                      'repeat': repeat, 'search_mode': 'required web_search, medium, KR',
                      'max_tool_calls': 3, 'consumer_chatgpt_measurement': False}
            record['measurement_type'] = question.get('measurement_type', 'discovery')
            request = urllib.request.Request('https://api.openai.com/v1/responses',
                                            data=json.dumps(payload).encode(),
                                            headers={'Authorization': 'Bearer ' + key,
                                                     'Content-Type': 'application/json'})
            try:
                with urllib.request.urlopen(request, timeout=90) as response:
                    result = json.load(response)
                messages = [part for item in result.get('output', []) if item.get('type') == 'message'
                            for part in item.get('content', []) if part.get('type') == 'output_text']
                answer = '\n'.join(part['text'] for part in messages)
                citations = [a for part in messages for a in part.get('annotations', [])
                             if a.get('type') == 'url_citation']
                record.update(status=result.get('status'), model=result.get('model'),
                              answer=answer, citations=citations, usage=result.get('usage'),
                              search_calls=[item for item in result.get('output', [])
                                            if item.get('type') == 'web_search_call'],
                              brand_mention_candidate=bool(re.search(
                                  r'deulli|(?<![가-힣])들리(?![가-힣])', answer, re.I)),
                              official_domain_cited=any(urllib.parse.urlsplit(a['url']).hostname in ('deulli.com', 'www.deulli.com')
                                                        for a in citations))
            except urllib.error.HTTPError as error:
                # Do not persist arbitrary upstream bodies or headers containing credentials.
                record.update(status='http_error', http_status=error.code)
            except (urllib.error.URLError, TimeoutError, ValueError) as error:
                record.update(status='request_error', error_type=type(error).__name__)
            with target.open('a') as stream:
                stream.write(json.dumps(record, ensure_ascii=False) + '\n')
            print(f'{question["id"]} repeat={repeat}: {record["status"]}; citations={len(record.get("citations", []))}', flush=True)
            if record.get('http_status') in (400, 401, 403, 429):
                raise SystemExit('Stopped on configuration, authorization, or rate-limit error')
            time.sleep(2)


if __name__ == '__main__':
    main()
