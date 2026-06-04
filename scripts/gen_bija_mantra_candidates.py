# -*- coding: utf-8 -*-
"""
Hybrid plan — fire Suno candidates for the API-safe (bīja) deity mantras.

Two takes each (A flowing / B intoned), Devanagari, slow monastic, steady-state per
the chant canon (ONLY the canonical words; no glosses, no build/crescendo). Saves to
Music/Studies/_app_candidates/<key>/ for Anant's ear-pick. The winner then gets
loop-engined (make_seamless_loop.py) + added to seed_deity_mantras.py and published.

Run (background):
  .venv/bin/python scripts/gen_bija_mantra_candidates.py
"""
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path('/Users/kashyap/projects/Agentic-dharmaweave')
sys.path.insert(0, str(ROOT))
from dotenv import load_dotenv  # noqa: E402
load_dotenv(ROOT / '.env', override=True)
from dharmaweave.music.generators import SunoMusicAPI  # noqa: E402

OUT = Path('/Users/kashyap/Library/CloudStorage/GoogleDrive-kashyap@tara-ventures.com/'
           'Shared drives/DharmaWeave/Creative & Content/Music/Studies/_app_candidates')

HIN = ("North Indian classical temple chant, deep resonant male priest chorus, sustained tanpura drone, "
       "soft harmonium swell, distant temple bells and conch, vast stone-temple hall reverb, very slow "
       "solemn 50 BPM, hypnotic rolling repetition, steady even and calm, sacred devotional power, "
       "authentic Sanskrit Devanagari pronunciation, deep sub-bass foundation, reimagined sacred chant")
BUD = ("Buddhist monastic chant, deep resonant male monk chorus, low overtone drone, long temple horns, "
       "ritual cymbals, large temple bells and tingsha, vast monastery hall reverb, very slow solemn "
       "50 BPM, hypnotic rolling repetition, steady even and calm, sacred grave reverence, authentic "
       "Sanskrit Devanagari pronunciation, sub-bass foundation, reimagined sacred chant")
NEG = ("pop, electronic, synth, EDM, fast tempo, drum machine, female pop vocal, shrill, autotune, rock, "
       "distortion, crescendo, build-up, dynamic swell, climax")

# key (== deityMantras.ts key == manifest key) -> mantra
MANTRAS = {
    'om_gam_ganapataye_namah':  ('ॐ गं गणपतये नमः', 'Om Gaṃ Gaṇapataye Namaḥ', HIN),
    'om_ham_hanumate_namah':    ('ॐ हं हनुमते नमः', 'Om Haṃ Hanumate Namaḥ', HIN),
    'om_shreem_mahalakshmiyei': ('ॐ श्रीं महालक्ष्म्यै नमः', 'Om Śrīṃ Mahālakṣmyai Namaḥ', HIN),
    'navarna_chamundayai':      ('ॐ ऐं ह्रीं क्लीं चामुण्डायै विच्चे', 'Om Aiṃ Hrīṃ Klīṃ Cāmuṇḍāyai Vicce', HIN),
    'om_aim_saraswatyai_namah': ('ॐ ऐं सरस्वत्यै नमः', 'Om Aiṃ Sarasvatyai Namaḥ', HIN),
    'om_krim_kalyai_namah':     ('ॐ क्रीं कालिकायै नमः', 'Om Krīṃ Kālikāyai Namaḥ', HIN),
    'om_sharavanabhavaya_namah':('ॐ शरवणभव', 'Om Śaravaṇabhava', HIN),
    'om_suryaya_namah':         ('ॐ सूर्याय नमः', 'Om Sūryāya Namaḥ', HIN),
    'om_brahmane_namah':        ('ॐ ब्रह्मणे नमः', 'Om Brahmaṇe Namaḥ', HIN),
    'buddham_saranam':          ('बुद्धं शरणं गच्छामि', 'Buddhaṃ Saraṇaṃ Gacchāmi', BUD),
    'om_a_ra_pa_ca_na_dhih':    ('ॐ अ र प च न धीः', 'Om A Ra Pa Ca Na Dhīḥ', BUD),
    'shakyamuni':               ('ॐ मुनि मुनि महामुनये स्वाहा', 'Om Muni Muni Mahāmunaye Svāhā', BUD),
}


def lyrics_for(deva: str, variant: str) -> str:
    if variant == 'A':  # flowing
        body = '\n'.join([deva] * 6)
        return f"[मंत्र — गहन पुरुष स्वर, धीमा, मठ की गूँज]\n{body}\n\n[सतत् — मंद होती गूँज]\n{deva}\n{deva}"
    # B — intoned, very slow
    body = '\n'.join([deva] * 5)
    return f"[बीज मंत्र — बहुत धीमा, ध्यानमग्न]\nॐ...\n{body}\n\n[ध्यान — सतत् ध्वनि]\n{deva}\n{deva}"


def fire(key: str, variant: str):
    deva, trans, tags = MANTRAS[key]
    out = OUT / key / f'{key}_{variant}.mp3'
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists() and out.stat().st_size > 200_000:
        return ('skip', f'{key}_{variant}', f'(cached) {out.stat().st_size // 1024} KB')
    t0 = time.time()
    try:
        g = SunoMusicAPI(model_version='sonic-v5-5')
        r = g.generate_custom(lyrics=lyrics_for(deva, variant), tags=tags,
                              title=f'{trans} — chant', negative_tags=NEG)
        out.write_bytes(r.audio_bytes)
        return ('ok', f'{key}_{variant}', f'✓ {out.stat().st_size // 1024} KB in {time.time() - t0:.0f}s')
    except Exception as e:
        return ('fail', f'{key}_{variant}', f'✗ {str(e)[:160]}')


def main() -> None:
    jobs = [(k, v) for k in MANTRAS for v in ('A', 'B')]
    print('═' * 64)
    print(f'  BĪJA MANTRA CANDIDATES — {len(MANTRAS)} mantras × 2 takes = {len(jobs)} fires')
    print(f'  → {OUT}')
    print('═' * 64, flush=True)
    res = {'ok': [], 'skip': [], 'fail': []}
    with ThreadPoolExecutor(max_workers=3) as ex:
        futs = {ex.submit(fire, k, v): (k, v) for k, v in jobs}
        for f in as_completed(futs):
            st, name, msg = f.result()
            res[st].append(name)
            print(f'  [{name}] {msg}', flush=True)
    print('─' * 64)
    for k in ('ok', 'skip', 'fail'):
        if res[k]:
            print(f'  {k} ({len(res[k])}): {", ".join(res[k])}')


if __name__ == '__main__':
    main()
