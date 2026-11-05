#!/usr/bin/env python3
"""Observe discovery at fixed intervals after publication, with bounded API requests."""
import argparse
import datetime
from pathlib import Path
import subprocess
import sys
import time


def timestamp(value):
    return datetime.datetime.fromisoformat(value.replace('Z', '+00:00')).timestamp()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--env-file', required=True)
    parser.add_argument('--first-run-utc', required=True)
    parser.add_argument('--last-run-utc', required=True)
    parser.add_argument('--interval-minutes', type=int, default=30)
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--questions', default='docs/geo/questions.json')
    parser.add_argument('--ids', default='Q02,Q03,Q04,Q06,Q07,Q08')
    parser.add_argument('--run', action='store_true')
    args = parser.parse_args()
    first, last = timestamp(args.first_run_utc), timestamp(args.last_run_utc)
    if not 15 <= args.interval_minutes <= 60 or not 0 <= last - first <= 12 * 3600:
        raise ValueError('Expected 15-60 minute intervals and at most a 12-hour schedule')
    schedule = []
    current = first
    while current <= last:
        schedule.append(current)
        current += args.interval_minutes * 60
    count = len(args.ids.split(','))
    print(f'Plan: {len(schedule)} rounds, {count} questions × 2 models per round = {len(schedule)*count*2} requests', flush=True)
    if not args.run:
        return
    destination = Path(args.output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    for scheduled in schedule:
        if time.time() - scheduled > 10 * 60:
            print('Skipping stale observation window', flush=True)
            continue
        next_heartbeat = 0
        while time.time() < scheduled:
            if time.monotonic() >= next_heartbeat:
                stamp = datetime.datetime.fromtimestamp(scheduled, datetime.timezone.utc).isoformat()
                print(f'Waiting for indexing propagation; next fixed observation: {stamp}', flush=True)
                next_heartbeat = time.monotonic() + 60
            time.sleep(min(10, max(0, scheduled - time.time())))
        label = datetime.datetime.fromtimestamp(scheduled, datetime.timezone.utc).strftime('%H%M')
        for model in ['gpt-6-luna', 'gpt-6-sol']:
            target = destination / f'api-watch-{label}-{model}.jsonl'
            if target.exists():
                raise ValueError(f'Observation file already exists: {target}')
            print(f'Starting observation {label}, {model}', flush=True)
            result = subprocess.run([sys.executable, 'scripts/geo-measure.py', '--env-file', args.env_file,
                                     '--questions', args.questions, '--ids', args.ids, '--model', model,
                                     '--output', str(target), '--run'], check=False)
            if result.returncode:
                raise SystemExit('Measurement stopped; inspect the recorded error before retrying')
        result = subprocess.run([sys.executable, 'scripts/geo-audit.py', '--output',
                                 str(destination / f'http-watch-{label}.json')], check=False)
        if result.returncode:
            print('HTTP observation had an error; retained for diagnosis', flush=True)
    print('All scheduled observations completed', flush=True)


if __name__ == '__main__':
    main()
