#!/usr/bin/env python
"""Publish the temple noticeboard.

Uploads config/noticeboard.json (the in-repo source of truth) to Supabase
Storage at dharma-art/config/noticeboard.json — the app's noticeboardStore
streams it via https://dharmaweave.com/cdn/dharma-art/config/noticeboard.json,
so a new notice appears WITHOUT an app release. The newest undismissed notice
shows as one quiet card on the Mandir wall.

Run after editing config/noticeboard.json (and only alongside the OTA the
notice describes — the notice must never precede the change):
  /Users/kashyap/projects/Agentic-dharmaweave/.venv/bin/python scripts/publish_noticeboard.py
"""
from __future__ import annotations
import json
import os

import requests
from dotenv import load_dotenv

AGENTIC = '/Users/kashyap/projects/Agentic-dharmaweave'
load_dotenv(AGENTIC + '/.env', override=True)
SUPA = os.environ['SUPABASE_URL']
SKEY = os.environ['SUPABASE_SERVICE_KEY']
BUCKET = 'dharma-art'
PATH = 'config/noticeboard.json'
SRC = os.path.join(os.path.dirname(__file__), '..', 'config', 'noticeboard.json')


def main() -> None:
    with open(SRC, encoding='utf-8') as f:
        board = json.load(f)
    notices = board.get('notices', [])
    assert notices and all(n.get('id') and n.get('title') and n.get('body') for n in notices), 'malformed noticeboard'
    for n in notices:
        print(f"  {n['date']}  {n['id']}  {n['title']}")

    payload = json.dumps(board, ensure_ascii=False).encode()
    r = requests.post(
        f'{SUPA}/storage/v1/object/{BUCKET}/{PATH}',
        headers={'apikey': SKEY, 'Authorization': f'Bearer {SKEY}',
                 'Content-Type': 'application/json', 'x-upsert': 'true'},
        data=payload, timeout=60,
    )
    r.raise_for_status()
    print(f'\nuploaded {len(notices)} notices -> {SUPA}/storage/v1/object/public/{BUCKET}/{PATH}  ({r.status_code})')


if __name__ == '__main__':
    main()
