#!/usr/bin/env python3
"""
Upload generated deity art to the streaming bucket.

PNG (1024x1536) → optimized JPG → dharma-art/deities/<slug>.jpg, and writes
dharma-art/deities/catalog.json (slug -> public url). The app references these
streamed URLs, so new deities appear without bundling them into the binary.

Run: /Users/kashyap/projects/Agentic-dharmaweave/.venv/bin/python scripts/upload_deity_art.py
"""
import io
import json
import os
import sys

import requests
from dotenv import load_dotenv
from PIL import Image

load_dotenv('/Users/kashyap/projects/Agentic-dharmaweave/.env', override=True)
SUPA = os.environ['SUPABASE_URL']
SKEY = os.environ['SUPABASE_SERVICE_KEY']
BUCKET = 'dharma-art'
PREFIX = 'deities'

SRC = ('/Users/kashyap/Library/CloudStorage/GoogleDrive-kashyap@tara-ventures.com/'
       'Shared drives/DharmaWeave/Apps & Tech/Images/incoming')

SLUGS = [
    # new figures
    'vishnu', 'brahma', 'saraswati', 'kali', 'parvati', 'kartikeya',
    'radha_krishna', 'venkateswara', 'surya',
    'green_tara', 'white_tara', 'padmasambhava', 'medicine_buddha',
    'amitabha', 'manjushri',
    # regenerated existing deities (replace the old bundled art)
    'ganesha', 'shiva', 'krishna', 'rama', 'hanuman', 'lakshmi',
    'buddha', 'avalokiteshvara',
]


def to_jpg(path: str) -> bytes:
    im = Image.open(path).convert('RGB')
    buf = io.BytesIO()
    im.save(buf, format='JPEG', quality=88, optimize=True, progressive=True)
    return buf.getvalue()


def put(obj: str, data: bytes, ct: str) -> str:
    r = requests.post(
        f'{SUPA}/storage/v1/object/{BUCKET}/{obj}',
        headers={'apikey': SKEY, 'Content-Type': ct, 'x-upsert': 'true'},
        data=data, timeout=180,
    )
    r.raise_for_status()
    return f'{SUPA}/storage/v1/object/public/{BUCKET}/{obj}'


def main() -> None:
    catalog: dict[str, str] = {}
    print(f'Uploading deity art → {BUCKET}/{PREFIX}/')
    for slug in SLUGS:
        path = f'{SRC}/{slug}.png'
        if not os.path.exists(path):
            print(f'  ⚠️  MISSING: {slug}.png', file=sys.stderr)
            continue
        data = to_jpg(path)
        url = put(f'{PREFIX}/{slug}.jpg', data, 'image/jpeg')
        catalog[slug] = url
        print(f'  ✅ {slug:18s} {len(data)/1024:6.0f} KB')

    blob = json.dumps(catalog, ensure_ascii=False, indent=2).encode('utf-8')
    put(f'{PREFIX}/catalog.json', blob, 'application/json')
    print(f'\n  ✅ catalog.json ({len(catalog)} deities)')
    print('  →', f'{SUPA}/storage/v1/object/public/{BUCKET}/{PREFIX}/catalog.json')


if __name__ == '__main__':
    main()
