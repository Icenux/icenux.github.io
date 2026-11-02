#!/usr/bin/env python3
"""Refresh `version` and `released` in _data/apps.yml from the latest GitHub release of each app.

Standard library only (runs on a bare GitHub Actions runner). The file is edited line by line so
comments and formatting survive. A repo without a release, or a failed request, keeps its current
values — the script never blanks anything.

    python3 scripts/update-versions.py            # update in place
    python3 scripts/update-versions.py --check    # only report, change nothing (exit 1 if outdated)

Environment: GITHUB_TOKEN (optional, raises the rate limit), GITHUB_API_URL (testing).
"""
import datetime
import json
import os
import re
import sys
import urllib.error
import urllib.request

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '_data', 'apps.yml')
API = os.environ.get('GITHUB_API_URL', 'https://api.github.com').rstrip('/')
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
          'October', 'November', 'December']


def latest_release(repo):
    req = urllib.request.Request(f'{API}/repos/{repo}/releases/latest', headers={
        'Accept': 'application/vnd.github+json', 'User-Agent': 'icenux-site-version-sync'})
    token = os.environ.get('GITHUB_TOKEN')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            j = json.load(r)
    except (urllib.error.URLError, TimeoutError, ValueError) as e:
        print(f'  ! {repo}: {e}')
        return None
    tag = (j.get('tag_name') or '').strip()
    pub = j.get('published_at') or ''
    if not tag:
        return None
    version = re.sub(r'^[vV]', '', tag)
    released = ''
    if re.match(r'\d{4}-\d{2}', pub):
        released = f'{MONTHS[int(pub[5:7]) - 1]} {pub[:4]}'
    return version, released


def value(line):
    return json.loads(line.split(':', 1)[1].strip())


def main():
    check = '--check' in sys.argv
    lines = open(DATA).read().split('\n')
    # Split into per-app blocks (each starts with "- slug:").
    starts = [i for i, l in enumerate(lines) if l.startswith('- slug:')]
    starts.append(len(lines))
    changed = []
    for a, b in zip(starts, starts[1:]):
        block = range(a, b)
        keys = {}
        for i in block:
            m = re.match(r'(?:- |  )(\w+): (".*")\s*$', lines[i])
            if m:
                keys[m.group(1)] = i
        slug = value(lines[keys['slug']])

        def sync(repo_key, ver_key, date_key=None):
            if repo_key not in keys or ver_key not in keys:
                return
            repo = value(lines[keys[repo_key]])
            got = latest_release(repo)
            if not got:
                print(f'  - {slug}: no release for {repo}, kept')
                return
            version, released = got
            if value(lines[keys[ver_key]]) != version:
                changed.append(f'{slug}: {ver_key} {value(lines[keys[ver_key]])} -> {version}')
                lines[keys[ver_key]] = re.sub(r'".*"', json.dumps(version), lines[keys[ver_key]])
                # A new version means a new release date; same version keeps the stored date.
                if date_key and date_key in keys and released:
                    lines[keys[date_key]] = re.sub(r'".*"', json.dumps(released), lines[keys[date_key]])
            else:
                print(f'  = {slug}: {ver_key} {version}')

        sync('repo', 'version', 'released')
        sync('android_repo', 'android_version')

    if changed:
        print('Updated:\n  ' + '\n  '.join(changed))
        if not check:
            open(DATA, 'w').write('\n'.join(lines))
        return 1 if check else 0
    print('Everything is up to date.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
