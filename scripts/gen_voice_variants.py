#!/usr/bin/env python
"""Generate per-verse VOICE VARIANTS so the app can toggle narrator + meaning language.

Per verse, 4 short clean tracks:
  recite_kuber   — the verse recited by Kuber
  recite_shardul — the verse recited by Shardul
  meaning_hi     — the Hindi meaning (Kuber)
  meaning_en     — the English meaning (Bill)
Uploads to public dharma-audio/voices/<course>/... and writes a manifest
voices/<course>.json (id -> {reciteKuber, reciteShardul, meaningHi, meaningEn}).
The app fetches the manifest at runtime (graceful fallback to the combined track).

Usage: gen_voice_variants.py <course_id>   (chalisa | gitacore | dhammapada | ...)
"""
from __future__ import annotations
import os, re, sys, json, time
import psycopg2, requests
from dotenv import load_dotenv

load_dotenv('/Users/kashyap/projects/Agentic-dharmaweave/.env', override=True)
SUPA = os.environ['SUPABASE_URL']; SKEY = os.environ['SUPABASE_SERVICE_KEY']
ELK = os.environ['ELEVENLABS_API_KEY']; MODEL = 'eleven_v3'; BUCKET = 'dharma-audio'
H = {'apikey': SKEY, 'Authorization': f'Bearer {SKEY}'}
KUBER = 'sZk20flPPGUa0sDxsZ8t'; SHARDUL = '6EphsklDopDQ6eRkwNHT'; BILL = 'pqHfZKP75CvOlQylNhV4'

# Reuse the same WHERE + id scheme as the course audio generators.
SPECS = {
    'chalisa': {"where": "source_text ilike '%chalisa%'", "kind": "chalisa"},
    'gitacore': {"where": "source_text ilike '%bhagavad%' and importance>=5 and source_location like 'Chapter %, Verse %'", "kind": "gita"},
    'dhammapada': {"where": "tradition::text ilike 'buddh%' and source_text ilike '%dhammapada%'", "kind": "generic"},
}


def vid(cid, loc, i):
    if cid == 'chalisa':
        m = re.search(r'(Doha|Chaupai)\s*(\d+)', loc or '', re.I)
        if m: return f"chalisa_{m.group(1).lower()}_{int(m.group(2))}"
    base = re.sub(r'[^a-z0-9]+', '_', (loc or f'v{i}').lower()).strip('_')
    return f'{cid}_{base}'[:60]


def tts(voice, text):
    r = requests.post(f'https://api.elevenlabs.io/v1/text-to-speech/{voice}',
                      headers={'xi-api-key': ELK, 'Content-Type': 'application/json'},
                      json={'text': text, 'model_id': MODEL,
                            'voice_settings': {'stability': 0.55, 'similarity_boost': 0.8, 'style': 0.4}}, timeout=120)
    return r.content if r.status_code == 200 else None


def up(path, data, ct='audio/mpeg'):
    r = requests.post(f'{SUPA}/storage/v1/object/{BUCKET}/{path}',
                      headers={**H, 'Content-Type': ct, 'x-upsert': 'true'}, data=data, timeout=120)
    return r.status_code in (200, 201)


def pub(path):
    return f'{SUPA}/storage/v1/object/public/{BUCKET}/{path}'


def main():
    cid = sys.argv[1]; spec = SPECS[cid]
    conn = psycopg2.connect(os.environ['SUPABASE_DB_URL']); conn.autocommit = True; cur = conn.cursor()
    cur.execute(f"select source_location, original_script, translation_hi, translation_en from wisdom where {spec['where']}")
    rows = cur.fetchall(); cur.close(); conn.close()
    manifest = {}
    for i, (loc, scr, hi, en) in enumerate(rows):
        sid = vid(cid, loc, i)
        verse = ' '.join((scr or '').split()).strip()
        if not verse:
            continue
        jobs = {
            'reciteKuber':   (KUBER, verse),
            'reciteShardul': (SHARDUL, verse),
            'meaningHi':     (KUBER, (hi or '').strip()),
            'meaningEn':     (BILL, (en or '').strip()),
        }
        entry = {}
        for tag, (voice, text) in jobs.items():
            if not text:
                continue
            audio = tts(voice, text)
            if not audio:
                print(f'  {sid}/{tag} FAIL'); continue
            p = f'voices/{cid}/{sid}_{tag}.mp3'
            if up(p, audio):
                entry[tag] = pub(p)
            time.sleep(0.15)
        manifest[sid] = entry
        print(f'  {sid}: {list(entry.keys())}')
    up(f'voices/{cid}.json', json.dumps(manifest, ensure_ascii=False).encode(), 'application/json')
    print(f'\n[{cid}] manifest -> {pub(f"voices/{cid}.json")}  ({len(manifest)} verses)')


if __name__ == '__main__':
    main()
