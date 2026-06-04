#!/usr/bin/env python
"""Publish the live Films catalog from YouTube.

Pulls long-form uploads (films, not shorts/reels) from the DharmaWeave channels,
and writes a public JSON to Storage. The app fetches it and deep-links to YouTube
(we keep the views/ad revenue — no in-app streaming). New film → re-run / cron → appears.
"""
from __future__ import annotations
import os, re, json
import requests
from dotenv import load_dotenv

load_dotenv('/Users/kashyap/projects/Agentic-dharmaweave/.env', override=True)
KEY = os.environ['YOUTUBE_API_KEY']
SUPA = os.environ['SUPABASE_URL']; SKEY = os.environ['SUPABASE_SERVICE_KEY']
BUCKET = 'dharma-art'; PATH = 'films/catalog.json'
H = {'apikey': SKEY, 'Authorization': f'Bearer {SKEY}'}

CHANNELS = [
    ('UUv9wPIKZ4rf21ZdnBN3t7xw', 'DharmaWeave'),
    ('UUhQ9jShVgVxgBxU2wW38ICg', 'DharmaWeave Katha'),
]
MIN_SECONDS = 180  # films only — exclude shorts/reels


def iso_to_sec(d: str) -> int:
    m = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', d or '')
    if not m:
        return 0
    h, mi, s = (int(x) if x else 0 for x in m.groups())
    return h * 3600 + mi * 60 + s


def uploads(playlist_id):
    vids, tok = [], None
    while True:
        r = requests.get('https://www.googleapis.com/youtube/v3/playlistItems', params={
            'part': 'contentDetails', 'playlistId': playlist_id, 'maxResults': 50,
            'pageToken': tok, 'key': KEY}, timeout=30).json()
        vids += [i['contentDetails']['videoId'] for i in r.get('items', [])]
        tok = r.get('nextPageToken')
        if not tok:
            break
    return vids


def details(ids):
    out = []
    for i in range(0, len(ids), 50):
        chunk = ids[i:i + 50]
        r = requests.get('https://www.googleapis.com/youtube/v3/videos', params={
            'part': 'snippet,contentDetails', 'id': ','.join(chunk), 'key': KEY}, timeout=30).json()
        out += r.get('items', [])
    return out


def main():
    films = []
    for pl, chname in CHANNELS:
        ids = uploads(pl)
        for v in details(ids):
            secs = iso_to_sec(v['contentDetails']['duration'])
            if secs < MIN_SECONDS:
                continue
            sn = v['snippet']
            th = sn['thumbnails']
            thumb = (th.get('maxres') or th.get('standard') or th.get('high') or th.get('medium') or {}).get('url', '')
            films.append({
                'id': v['id'], 'title': sn['title'],
                'channel': chname, 'thumb': thumb,
                'url': f"https://www.youtube.com/watch?v={v['id']}",
                'duration': secs, 'published': sn.get('publishedAt', '')[:10],
            })
    films.sort(key=lambda f: f['published'], reverse=True)
    payload = json.dumps({'generated_at': '2026-06-04', 'films': films}, ensure_ascii=False).encode()
    r = requests.post(f'{SUPA}/storage/v1/object/{BUCKET}/{PATH}',
                      headers={**H, 'Content-Type': 'application/json', 'x-upsert': 'true'},
                      data=payload, timeout=60)
    print(f'uploaded {len(films)} films -> {SUPA}/storage/v1/object/public/{BUCKET}/{PATH}  ({r.status_code})')
    for f in films[:15]:
        print(f"  {f['duration']//60}m  {f['title'][:60]}")


if __name__ == '__main__':
    main()
