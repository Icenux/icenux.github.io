#!/usr/bin/env python3
"""Refresh release data in _data/apps.yml from the latest GitHub release of each app.

For every app with a `repo` it updates `version`, `released` and `tag`. Apps that ship a single file
from the repository (`script_path`, e.g. `displays` or `livem_{version}.deb`) also get the SHA-256 of
that file at the release tag, so the site can show a checksum next to a download that is pinned to
the tag.

Standard library only (runs on a bare GitHub Actions runner). The file is edited line by line so
comments and formatting survive. A repo without a release, or a failed request, keeps its current
values — the script never blanks anything.

    python3 scripts/update-versions.py            # update in place
    python3 scripts/update-versions.py --check    # only report, change nothing (exit 1 if outdated)

Environment: GITHUB_TOKEN (optional, raises the rate limit), GITHUB_API_URL and GITHUB_RAW_URL
(testing).
"""
import datetime
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '_data', 'apps.yml')
API = os.environ.get('GITHUB_API_URL', 'https://api.github.com').rstrip('/')
RAW = os.environ.get('GITHUB_RAW_URL', 'https://raw.githubusercontent.com').rstrip('/')
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
          'October', 'November', 'December']


def _request(url, token=True):
    req = urllib.request.Request(url, headers={'Accept': 'application/vnd.github+json',
                                               'User-Agent': 'icenux-site-version-sync'})
    tok = os.environ.get('GITHUB_TOKEN')
    if token and tok and url.startswith(API):
        req.add_header('Authorization', f'Bearer {tok}')
    return urllib.request.urlopen(req, timeout=20)


def latest_release(repo):
    try:
        with _request(f'{API}/repos/{repo}/releases/latest') as r:
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
    return version, released, tag


def file_sha256(repo, tag, path):
    url = f'{RAW}/{repo}/{urllib.parse.quote(tag)}/{urllib.parse.quote(path)}'
    try:
        with _request(url, token=False) as r:
            return hashlib.sha256(r.read()).hexdigest()
    except (urllib.error.URLError, TimeoutError) as e:
        print(f'  ! sha256 {url}: {e}')
        return None


def value(line):
    return json.loads(line.split(':', 1)[1].strip())


def setv(lines, idx, new):
    lines[idx] = re.sub(r'".*"', lambda m: json.dumps(new), lines[idx])


def main():
    check = '--check' in sys.argv
    lines = open(DATA).read().split('\n')
    # Split into per-app blocks (each starts with "- slug:").
    starts = [i for i, l in enumerate(lines) if l.startswith('- slug:')]
    starts.append(len(lines))
    changed = []
    for a, b in zip(starts, starts[1:]):
        keys = {}
        for i in range(a, b):
            m = re.match(r'(?:- |  )(\w+): (".*")\s*$', lines[i])
            if m:
                keys[m.group(1)] = i
        slug = value(lines[keys['slug']])

        if 'repo' in keys and 'version' in keys:
            repo = value(lines[keys['repo']])
            got = latest_release(repo)
            if not got:
                print(f'  - {slug}: no release for {repo}, kept')
            else:
                version, released, tag = got
                old_version = value(lines[keys['version']])
                if old_version != version:
                    changed.append(f'{slug}: version {old_version} -> {version}')
                    setv(lines, keys['version'], version)
                    # A new version means a new release date; same version keeps the stored date.
                    if 'released' in keys and released:
                        setv(lines, keys['released'], released)
                else:
                    print(f'  = {slug}: version {version}')
                if 'tag' in keys and value(lines[keys['tag']]) != tag:
                    changed.append(f'{slug}: tag {value(lines[keys["tag"]])} -> {tag}')
                    setv(lines, keys['tag'], tag)
                if 'script_path' in keys and 'sha256' in keys:
                    path = value(lines[keys['script_path']]).replace('{version}', version)
                    digest = file_sha256(repo, tag, path)
                    old = value(lines[keys['sha256']])
                    if digest and digest != old:
                        note = '' if not old or old_version != version else '  (WARNING: file changed under the same tag)'
                        changed.append(f'{slug}: sha256 of {path} at {tag} {old[:8] or "-"} -> {digest[:8]}{note}')
                        setv(lines, keys['sha256'], digest)

        if 'android_repo' in keys and 'android_version' in keys:
            got = latest_release(value(lines[keys['android_repo']]))
            if got and value(lines[keys['android_version']]) != got[0]:
                changed.append(f'{slug}: android_version {value(lines[keys["android_version"]])} -> {got[0]}')
                setv(lines, keys['android_version'], got[0])

    if changed:
        print('Updated:\n  ' + '\n  '.join(changed))
        if not check:
            open(DATA, 'w').write('\n'.join(lines))
        return 1 if check else 0
    print('Everything is up to date.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
