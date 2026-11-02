#!/usr/bin/env python3
"""Turn the PNG screenshots in assets/apps into WebP and make the 16:9 card thumbnails.

    python3 scripts/optimize-images.py            # convert new PNGs, (re)build thumbnails
    python3 scripts/optimize-images.py --keep     # keep the PNG after converting

Needs Pillow (`pip install pillow`). Not part of the site build: run it locally when you add a
screenshot, then commit the WebP files. Terminal screenshots stay lossless when that is not much
bigger than lossy, so text remains crisp.

A card thumbnail is `card.webp` next to the screenshot named in THUMBS: the top 16:9 part of the
image (the same crop the card shows), at most 720 px wide.
"""
import os
import sys

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'apps')

# app folder -> screenshot used on the card in /apps/
THUMBS = {
    'live-m': 'terminal',
    'repo-doctor': 'triage',
    'sway-desktop-stats': 'widget',
    'ccc': 'conversations',
    'displays': 'screenshot',
    'sgc-screensaver': 'screenshot',
}


def to_webp(png, keep):
    webp = os.path.splitext(png)[0] + '.webp'
    im = Image.open(png)
    has_alpha = im.mode in ('RGBA', 'LA') or 'transparency' in im.info
    im = im.convert('RGBA' if has_alpha else 'RGB')
    lossy, lossless = webp + '.lossy', webp + '.lossless'
    im.save(lossy, 'WEBP', quality=84, method=6)
    im.save(lossless, 'WEBP', lossless=True, method=6)
    pick = lossless if os.path.getsize(lossless) <= 1.3 * os.path.getsize(lossy) else lossy
    os.replace(pick, webp)
    for f in (lossy, lossless):
        if os.path.exists(f):
            os.remove(f)
    print(f'{os.path.relpath(png, ROOT)}: {os.path.getsize(png) // 1024} KB -> {os.path.getsize(webp) // 1024} KB webp')
    if not keep:
        os.remove(png)


def thumb(folder, name):
    src = os.path.join(ROOT, folder, name + '.webp')
    im = Image.open(src).convert('RGB')
    w = min(720, im.width)
    h = round(w * 9 / 16)
    crop_h = round(im.width * 9 / 16)           # the top 16:9 part of the screenshot
    im = im.crop((0, 0, im.width, min(crop_h, im.height))).resize((w, h), Image.LANCZOS)
    out = os.path.join(ROOT, folder, 'card.webp')
    im.save(out, 'WEBP', quality=82, method=6)
    print(f'{folder}/card.webp: {w}x{h}, {os.path.getsize(out) // 1024} KB')


def main():
    keep = '--keep' in sys.argv
    for dirpath, _, files in os.walk(ROOT):
        for f in sorted(files):
            if f.lower().endswith('.png'):
                to_webp(os.path.join(dirpath, f), keep)
    for folder, name in THUMBS.items():
        thumb(folder, name)


if __name__ == '__main__':
    main()
