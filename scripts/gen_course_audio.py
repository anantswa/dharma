#!/usr/bin/env python
"""Generic streaming course generator.

Usage: gen_course_audio.py <course_id>
Sources verified verses from Postgres (NEVER fabricates), narrates each with Kuber
(ElevenLabs), uploads to the public dharma-audio bucket, and writes
src/data/<course_id>Audio.ts ( <COURSE>_VERSES ). App streams + caches.
"""
from __future__ import annotations
import os, re, sys, json, time
from pathlib import Path
import psycopg2, requests
from dotenv import load_dotenv

AGENTIC = Path('/Users/kashyap/projects/Agentic-dharmaweave')
DHARMA = Path('/Users/kashyap/projects/dharma')
load_dotenv(AGENTIC / '.env', override=True)
SUPA = os.environ['SUPABASE_URL']; SKEY = os.environ['SUPABASE_SERVICE_KEY']
ELK = os.environ['ELEVENLABS_API_KEY']
KUBER = 'sZk20flPPGUa0sDxsZ8t'; MODEL = 'eleven_v3'; BUCKET = 'dharma-audio'
H = {'apikey': SKEY, 'Authorization': f'Bearer {SKEY}'}

# Each course: SQL WHERE (verified rows only) + ordering + display strings.
SPECS = {
    'dhammapada': {
        'title': 'Dhammapada', 'subtitle': "the Buddha's path of truth",
        'export': 'DHAMMAPADA_VERSES',
        'where': "tradition::text ilike 'buddh%' and source_text ilike '%dhammapada%'",
        'order': 'id',
    },
    'gita2': {
        'title': 'Bhagavad Gita — Chapter 2', 'subtitle': 'Sānkhya Yoga, narrated by Kuber',
        'export': 'GITA2_VERSES',
        'where': "source_text ilike '%bhagavad%' and source_location like 'Chapter 2,%'",
        'order': "(substring(source_location from 'Verse ([0-9]+)'))::int",
    },
    'gitacore': {
        'title': 'Bhagavad Gita — Core', 'subtitle': 'the essential shlokas, narrated by Kuber',
        'export': 'GITACORE_VERSES',
        'where': "source_text ilike '%bhagavad%' and importance>=5 and source_location like 'Chapter %, Verse %'",
        'order': "(substring(source_location from 'Chapter ([0-9]+)'))::int, (substring(source_location from 'Verse ([0-9]+)'))::int",
    },
    'zen': {
        'title': 'Zen — Koans & Mind', 'subtitle': 'gateless gate, narrated by Kuber',
        'export': 'ZEN_VERSES',
        'where': "tradition::text ilike 'zen' and importance>=4",
        'order': 'importance desc, id',
    },
    'upanishads': {
        'title': 'Upanishads — Mahāvākyas', 'subtitle': 'the great sayings, narrated by Kuber',
        'export': 'UPANISHADS_VERSES',
        'where': "source_text ilike '%upanishad%' and importance>=4",
        'order': 'importance desc, id',
    },
    'yogasutras': {
        'title': 'Yoga Sutras of Patañjali', 'subtitle': 'the science of the mind, narrated by Kuber',
        'export': 'YOGASUTRAS_VERSES',
        'where': "source_text ilike '%yoga sutra%' and importance>=3",
        'order': 'id',
    },
    'ramayana': {
        'title': 'Ramayana — Key Verses', 'subtitle': 'the epic of Rama, narrated by Kuber',
        'export': 'RAMAYANA_VERSES',
        'where': "(source_text ilike '%ramayan%' or source_text ilike '%ramcharit%') and importance>=5",
        'order': 'importance desc, id',
    },
}

DEV = str.maketrans('0123456789', '०१२३४५६७८९')


def slug(cid, loc, i):
    base = re.sub(r'[^a-z0-9]+', '_', (loc or f'v{i}').lower()).strip('_')
    return f'{cid}_{base}'[:60]


def fetch(spec):
    conn = psycopg2.connect(os.environ['SUPABASE_DB_URL']); conn.autocommit = True; cur = conn.cursor()
    cur.execute(f"""select source_location, original_script, transliteration, translation_en, translation_hi
                    from wisdom where {spec['where']} order by {spec['order']}""")
    rows = cur.fetchall(); cur.close(); conn.close(); return rows


def narrate(text):
    r = requests.post(f'https://api.elevenlabs.io/v1/text-to-speech/{KUBER}',
                      headers={'xi-api-key': ELK, 'Content-Type': 'application/json'},
                      json={'text': text, 'model_id': MODEL,
                            'voice_settings': {'stability': 0.6, 'similarity_boost': 0.8, 'style': 0.4}}, timeout=120)
    return r.content if r.status_code == 200 else None


def upload(path, data):
    r = requests.post(f'{SUPA}/storage/v1/object/{BUCKET}/{path}',
                      headers={**H, 'Content-Type': 'audio/mpeg', 'x-upsert': 'true'}, data=data, timeout=120)
    return r.status_code in (200, 201)


def main():
    cid = sys.argv[1]; spec = SPECS[cid]
    rows = fetch(spec)
    print(f'[{cid}] {len(rows)} verses')
    man = []
    for i, (loc, script, tr, en, hi) in enumerate(rows):
        sid = slug(cid, loc, i)
        shloka = (script or '').replace('\n', ' ').strip()
        if not shloka:
            continue
        meaning = (hi or '').strip()
        audio = narrate(f'{shloka} ।। भावार्थ। {meaning}')
        if not audio:
            print(f'  [{cid}] {sid} narrate FAIL'); continue
        ok = upload(f'{cid}/{sid}.mp3', audio)
        print(f'  [{cid}] {sid} {len(audio)//1024}KB {"ok" if ok else "FAIL"}')
        if not ok:
            continue
        man.append({'id': sid, 'titleHi': loc or f'Verse {i+1}', 'titleEn': loc or f'Verse {i+1}',
                    'sanskrit': shloka, 'transliteration': (tr or '').strip(),
                    'meaningHi': meaning, 'meaningEn': (en or '').strip(),
                    'audioUrl': f'{SUPA}/storage/v1/object/public/{BUCKET}/{cid}/{sid}.mp3'})
        time.sleep(0.25)

    out = [f'// AUTO-GENERATED by gen_course_audio.py {cid} — do not edit.',
           f'export const {spec["export"]} = [']
    for e in man:
        out.append('  ' + json.dumps(e, ensure_ascii=False) + ',')
    out.append('];')
    (DHARMA / 'src' / 'data' / f'{cid}Audio.ts').write_text('\n'.join(out) + '\n')
    print(f'[{cid}] wrote {len(man)} -> src/data/{cid}Audio.ts')


if __name__ == '__main__':
    main()
