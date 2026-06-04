#!/usr/bin/env python
"""Publish the live Shop catalog.

Reads PUBLISHED products from the Postgres `products` table, normalizes books/comics
(cover + buy links + price), and uploads a public JSON to Supabase Storage. The app
fetches this at runtime, so a newly-launched product appears WITHOUT an app update.

Run on every product launch (or via cron):
  /Users/kashyap/projects/Agentic-dharmaweave/.venv/bin/python scripts/gen_shop_catalog.py
"""
from __future__ import annotations
import os, re, json, datetime
import psycopg2, requests
from dotenv import load_dotenv

AGENTIC = '/Users/kashyap/projects/Agentic-dharmaweave'
load_dotenv(AGENTIC + '/.env', override=True)
SUPA = os.environ['SUPABASE_URL']; SKEY = os.environ['SUPABASE_SERVICE_KEY']
BUCKET = 'dharma-art'; PATH = 'shop/catalog.json'
H = {'apikey': SKEY, 'Authorization': f'Bearer {SKEY}'}

# Known covers from the website catalog (authoritative), keyed by product name.
WEB = {}
try:
    wc = json.load(open('/Users/kashyap/DharmaWeave/frontend/src/data/catalog.json'))
    for b in wc.get('books', []):
        if b.get('cover_url'):
            WEB[b['name'].strip().lower()] = b['cover_url']
except Exception:
    pass


def slugify(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def cover_for(name: str) -> str:
    key = name.strip().lower()
    if key in WEB:
        return WEB[key]
    # convention used by the website covers
    url = f'{SUPA}/storage/v1/object/public/dharma-images/website/books/{slugify(name)}/cover.jpg'
    try:
        if requests.head(url, timeout=15).status_code == 200:
            return url
    except Exception:
        pass
    return ''


def pick(pid: dict, *ks):
    for k in ks:
        if pid.get(k):
            return pid[k]
    return ''


def price_str(p):
    if not p:
        return ''
    for k in ('kdp_usd', 'kdp_paperback_usd', 'kdp_kindle_usd'):
        if p.get(k):
            return f"${p[k]}"
    if p.get('google_books_sgd'):
        return f"S${p['google_books_sgd']}"
    return ''


def main():
    conn = psycopg2.connect(os.environ['SUPABASE_DB_URL']); conn.autocommit = True; cur = conn.cursor()
    cur.execute("""select id, name, description, tradition, type, platform_ids, price
                   from products where status='published' and type in ('book','comic')
                   order by created_at desc nulls last""")
    books = []
    for pid_, name, desc, trad, typ, pids, price in cur.fetchall():
        pids = pids or {}
        amazon = pick(pids, 'amazon_us', 'amazon_us_kindle', 'amazon_us_paperback', 'amazon_in', 'a_co_short')
        google = pick(pids, 'google_play_url', 'google_books_url')
        if not (amazon or google):
            print(f'  skip (no buy link): {name}'); continue
        cover = cover_for(name)
        if not cover:
            print(f'  skip (no cover): {name}'); continue
        books.append({'id': str(pid_), 'name': name, 'description': (desc or '').strip(),
                      'tradition': trad or '', 'cover': cover, 'price': price_str(price),
                      'amazon': amazon, 'google': google})
        print(f'  + {name}')
    cur.close(); conn.close()

    payload = json.dumps({'generated_at': '2026-06-04', 'books': books}, ensure_ascii=False).encode()
    r = requests.post(f'{SUPA}/storage/v1/object/{BUCKET}/{PATH}',
                      headers={**H, 'Content-Type': 'application/json', 'x-upsert': 'true'},
                      data=payload, timeout=60)
    url = f'{SUPA}/storage/v1/object/public/{BUCKET}/{PATH}'
    print(f'\nuploaded {len(books)} books -> {url}  ({r.status_code})')


if __name__ == '__main__':
    main()
