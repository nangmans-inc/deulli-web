#!/usr/bin/env python3
"""Validate live canonical pages, then optionally notify IndexNow once."""
import argparse
import datetime
import json
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'deulli-indexnow/1.0'})
    with urllib.request.urlopen(request, timeout=20) as response:
        if response.status != 200 or urllib.parse.urlsplit(response.url).hostname != 'deulli.com':
            raise ValueError('Unexpected live URL response')
        data = response.read(1024 * 1024 + 1)
        if len(data) > 1024 * 1024:
            raise ValueError('Response exceeds 1 MiB')
        return data.decode('utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--submit', action='store_true', help='Send one POST after live validation')
    parser.add_argument('--output', default='docs/geo/research/indexnow-submission.json')
    args = parser.parse_args()
    payload = json.loads(Path('docs/geo/indexnow.json').read_text())
    if payload['host'] != 'deulli.com' or not 1 <= len(payload['urlList']) <= 10:
        raise ValueError('Expected deulli.com and at most 10 URLs')
    for url in [payload['keyLocation'], *payload['urlList']]:
        parsed = urllib.parse.urlsplit(url)
        if parsed.scheme != 'https' or parsed.netloc != 'deulli.com' or parsed.query or parsed.fragment:
            raise ValueError('Only canonical HTTPS deulli.com URLs are allowed')
    if fetch(payload['keyLocation']).strip() != payload['key']:
        raise ValueError('Live ownership key is not deployed')
    for url in payload['urlList']:
        body = fetch(url)
        if f'rel="canonical" href="{url}"' not in body or 'content="noindex' in body:
            raise ValueError(f'Canonical/indexability mismatch: {url}')
    if not args.submit:
        print('Live ownership key and canonical pages verified. No submission sent.')
        return
    request = urllib.request.Request(
        'https://api.indexnow.org/indexnow',
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json; charset=utf-8'}, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            status = response.status
            body = response.read(65536).decode('utf-8', errors='replace')
    except urllib.error.HTTPError as error:
        status = error.code
        body = error.read(65536).decode('utf-8', errors='replace')
    report = {'submitted_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'endpoint': 'https://api.indexnow.org/indexnow', 'urls': payload['urlList'],
              'status': status, 'response': body,
              'meaning': 'Submission receipt only; not proof of crawling, indexing, or AI citation'}
    Path(args.output).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f'IndexNow returned HTTP {status}. Receipt saved to {args.output}')
    if status not in (200, 202):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
