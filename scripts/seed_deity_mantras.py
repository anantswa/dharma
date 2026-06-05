#!/usr/bin/env python3
"""
Seed the deity-mantra bucket from the finished Music/Studies masters.

Uploads each finished, loop-able chant to `dharma-audio/mantras/<key>.mp3` and
writes `dharma-audio/mantras/catalog.json` (key -> public url). The app reads that
manifest live, so a deity's chant appears the moment its master is uploaded — no
app rebuild. As Anant ear-picks more mantras into Music/Studies/NN_<slug>/ and
loop-engines them, add a row to SOURCES and re-run.

CANON (music_canon.md "authentic mantra chant"): only the canonical words, slow,
seamless steady-state loop, mastered loop-clean (NOT the song's -14 LUFS + fades).

Run:  /Users/kashyap/projects/Agentic-dharmaweave/.venv/bin/python scripts/seed_deity_mantras.py
"""
import json
import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv('/Users/kashyap/projects/Agentic-dharmaweave/.env', override=True)
SUPA = os.environ['SUPABASE_URL']
SKEY = os.environ['SUPABASE_SERVICE_KEY']
BUCKET = 'dharma-audio'
PREFIX = 'mantras'

STUDIES = ('/Users/kashyap/Library/CloudStorage/GoogleDrive-kashyap@tara-ventures.com/'
           'Shared drives/DharmaWeave/Creative & Content/Music/Studies')
SNDLIB = '/Users/kashyap/projects/Agentic-dharmaweave/Sound Library'
DM = '/Users/kashyap/projects/Agentic-dharmaweave/output/deity_mantras'  # loop-engined app masters

# key (== app manifest key == deityMantras.ts slug) -> finished master file.
# Only FINISHED, loop-able masters belong here. Everything else is a gap (see below).
SOURCES = {
    'om_namah_shivaya':            f'{STUDIES}/Om Namah Shivaye/renders/108_cycles_v5_continuous_tanpura.mp3',
    'om_namo_bhagavate_vasudevaya': f'{STUDIES}/07_om_namo_bhagavate_vasudevaya/_seamless_loop_v2/vasudeva_take1_seamless_3min.mp3',
    'om_mani_padme_hum':           f'{STUDIES}/_loop_engine_AB_proof/NEW_om_mani_padme_hum_seamless_3min.mp3',
    'om_ah_hung_vajra_guru':       '/Users/kashyap/projects/Agentic-dharmaweave/output/deity_mantras/om_ah_hung_vajra_guru.mp3',  # Padmasambhava
    # bīja ear-picks (take A, trimmed → seamless loop). Ganesha = Anant's exact 17–47s;
    # the rest auto-windowed (energy-detected), spot-fix any in-app.
    'om_gam_ganapataye_namah':     f'{DM}/om_gam_ganapataye_namah.mp3',   # Ganesha · A · 17–47s
    'om_ham_hanumate_namah':       f'{DM}/om_ham_hanumate_namah.mp3',     # Hanuman
    'om_shreem_mahalakshmiyei':    f'{DM}/om_shreem_mahalakshmiyei.mp3',  # Lakshmi
    'navarna_chamundayai':         f'{DM}/navarna_chamundayai.mp3',       # Devi / Parvati
    'om_aim_saraswatyai_namah':    f'{DM}/om_aim_saraswatyai_namah.mp3',  # Saraswati
    'om_krim_kalyai_namah':        f'{DM}/om_krim_kalyai_namah.mp3',      # Kali
    'om_sharavanabhavaya_namah':   f'{DM}/om_sharavanabhavaya_namah.mp3', # Kartikeya
    'om_suryaya_namah':            f'{DM}/om_suryaya_namah.mp3',          # Surya
    'om_brahmane_namah':           f'{DM}/om_brahmane_namah.mp3',         # Brahma
    'buddham_saranam':             f'{DM}/buddham_saranam.mp3',           # Buddha
    'shakyamuni':                  f'{DM}/shakyamuni.mp3',                # Shakyamuni
    'om':                          f'{DM}/om.mp3',  # universal fallback — good group-Om seamless loop
}


def upload(path: str, key: str) -> str:
    with open(path, 'rb') as f:
        data = f.read()
    obj = f'{PREFIX}/{key}.mp3'
    r = requests.post(
        f'{SUPA}/storage/v1/object/{BUCKET}/{obj}',
        headers={'apikey': SKEY, 'Content-Type': 'audio/mpeg', 'x-upsert': 'true'},
        data=data, timeout=180,
    )
    r.raise_for_status()
    url = f'{SUPA}/storage/v1/object/public/{BUCKET}/{obj}'
    print(f'  ✅ {key:32s} {len(data)/1024:7.0f} KB  {url}')
    return url


def main() -> None:
    catalog: dict[str, str] = {}
    print('Uploading finished mantra masters →', f'{BUCKET}/{PREFIX}/')
    for key, path in SOURCES.items():
        if not os.path.exists(path):
            print(f'  ⚠️  MISSING (skipped): {key}  ←  {path}', file=sys.stderr)
            continue
        catalog[key] = upload(path, key)

    # write the live manifest
    blob = json.dumps(catalog, ensure_ascii=False, indent=2).encode('utf-8')
    r = requests.post(
        f'{SUPA}/storage/v1/object/{BUCKET}/{PREFIX}/catalog.json',
        headers={'apikey': SKEY, 'Content-Type': 'application/json', 'x-upsert': 'true'},
        data=blob, timeout=60,
    )
    r.raise_for_status()
    print(f'\n  ✅ catalog.json  ({len(catalog)} chants live)')
    print('  →', f'{SUPA}/storage/v1/object/public/{BUCKET}/{PREFIX}/catalog.json')


if __name__ == '__main__':
    main()
