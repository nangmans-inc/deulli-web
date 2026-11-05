#!/usr/bin/env python3
"""Capture a small public-site baseline without touching development sessions."""
import argparse
import datetime
import hashlib
import json
import re
import urllib.error
import urllib.request
from html.parser import HTMLParser
from pathlib import Path


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hidden = 0
        self.text = []
        self.canonical = []
        self.robots = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style', 'head'):
            self.hidden += 1
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name') == 'robots':
            self.robots.append(attrs.get('content'))

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'head'):
            self.hidden = max(0, self.hidden - 1)

    def handle_data(self, data):
        if not self.hidden and data.strip():
            self.text.append(data.strip())


def capture(path):
    url = 'https://deulli.com' + path
    result = {'requested_url': url}
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'deulli-public-audit/1.0'})
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = response.read(1024 * 1024 + 1)
            if len(raw) > 1024 * 1024:
                raise ValueError('Response exceeds 1 MiB limit')
            body = raw.decode('utf-8')
            result.update(status=response.status, final_url=response.url,
                          content_type=response.headers.get('Content-Type'),
                          x_robots_tag=response.headers.get('X-Robots-Tag'),
                          sha256=hashlib.sha256(raw).hexdigest())
            if path == '/':
                page = Page()
                page.feed(body)
                result.update(visible_text=' '.join(page.text), canonical=page.canonical,
                              robots=page.robots,
                              json_ld=[json.loads(s) for s in re.findall(
                                  r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
                                  body, re.S | re.I)])
            else:
                result['body'] = body
    except (urllib.error.URLError, TimeoutError, ValueError) as error:
        result['error'] = str(error)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default='docs/geo/research/http-baseline.json')
    args = parser.parse_args()
    report = {'observed_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'method': 'Public HTTP audit; not indexing or AI recommendation measurement',
              'pages': [capture(p) for p in ('/', '/robots.txt', '/sitemap-index.xml')]}
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f'Saved {len(report["pages"])} URL observations to {target}')
    if any('error' in page for page in report['pages']):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
