# -*- coding: utf-8 -*-
"""
Upload the bīja candidate takes + build an iPad-friendly A/B ear-pick page.

Reads Music/Studies/_app_candidates/<key>/<key>_{A,B}.mp3, uploads each to a public
review path, and writes review.html (A vs B player per mantra). Anant opens the URL,
picks A or B per deity, tells me; I loop-engine + publish the winners.
"""
import os
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv('/Users/kashyap/projects/Agentic-dharmaweave/.env', override=True)
SUPA = os.environ['SUPABASE_URL']
SKEY = os.environ['SUPABASE_SERVICE_KEY']
CAND = Path('/Users/kashyap/Library/CloudStorage/GoogleDrive-kashyap@tara-ventures.com/'
            'Shared drives/DharmaWeave/Creative & Content/Music/Studies/_app_candidates')

# key -> (deity display, devanagari)
MANTRAS = [
    ('om_gam_ganapataye_namah',  'Ganesha',   'ॐ गं गणपतये नमः'),
    ('om_ham_hanumate_namah',    'Hanuman',   'ॐ हं हनुमते नमः'),
    ('om_shreem_mahalakshmiyei', 'Lakshmi',   'ॐ श्रीं महालक्ष्म्यै नमः'),
    ('navarna_chamundayai',      'Devi / Parvati', 'ॐ ऐं ह्रीं क्लीं चामुण्डायै विच्चे'),
    ('om_aim_saraswatyai_namah', 'Saraswati', 'ॐ ऐं सरस्वत्यै नमः'),
    ('om_krim_kalyai_namah',     'Kali',      'ॐ क्रीं कालिकायै नमः'),
    ('om_sharavanabhavaya_namah','Kartikeya', 'ॐ शरवणभव'),
    ('om_suryaya_namah',         'Surya',     'ॐ सूर्याय नमः'),
    ('om_brahmane_namah',        'Brahma',    'ॐ ब्रह्मणे नमः'),
    ('buddham_saranam',          'Buddha',    'बुद्धं शरणं गच्छामि'),
    ('shakyamuni',               'Shakyamuni','ॐ मुनि मुनि महामुनये स्वाहा'),
]
BUCKET = 'dharma-audio'
PREFIX = '_candidates'


def put(obj, data, ct):
    r = requests.post(f'{SUPA}/storage/v1/object/{BUCKET}/{obj}',
                      headers={'apikey': SKEY, 'Content-Type': ct, 'x-upsert': 'true'},
                      data=data, timeout=180)
    r.raise_for_status()
    return f'{SUPA}/storage/v1/object/public/{BUCKET}/{obj}'


def main():
    rows = ''
    for key, deity, deva in MANTRAS:
        players = ''
        for v in ('A', 'B'):
            f = CAND / key / f'{key}_{v}.mp3'
            if not f.exists():
                players += f'<div class=tk><b>{v}</b> <i>missing</i></div>'
                continue
            url = put(f'{PREFIX}/{key}_{v}.mp3', f.read_bytes(), 'audio/mpeg')
            label = 'A · flowing' if v == 'A' else 'B · intoned'
            players += (f'<div class=tk><div class=lbl>{label}</div>'
                        f'<audio controls preload=none src="{url}"></audio></div>')
        rows += (f'<div class=card><div class=hd><span class=deity>{deity}</span>'
                 f'<span class=deva>{deva}</span></div>{players}</div>')

    html = f"""<!doctype html><html><head><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>Deity Mantras — A/B ear-pick</title>
<style>
 body{{margin:0;background:#0b1220;color:#f1f5f9;font-family:-apple-system,system-ui,sans-serif;padding:18px 14px 60px}}
 h1{{font-size:20px;margin:0 0 4px}} .sub{{color:#94a3b8;font-size:13px;margin:0 0 18px}}
 .card{{background:#111a2e;border:1px solid rgba(251,191,36,.18);border-radius:16px;padding:14px 16px;margin-bottom:14px}}
 .hd{{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:10px}}
 .deity{{font-size:17px;font-weight:700;color:#fbbf24}} .deva{{font-size:16px;color:#e2e8f0}}
 .tk{{margin:8px 0}} .lbl{{font-size:12px;color:#94a3b8;margin-bottom:4px}}
 audio{{width:100%}}
 .note{{color:#64748b;font-size:12px;margin-top:8px}}
</style></head><body>
<h1>Deity Mantras — A/B ear-pick</h1>
<p class=sub>Play A vs B for each. Reply with your pick per deity (e.g. “Ganesha B, Hanuman A…”). I loop-engine the winners + publish — live, no rebuild.</p>
{rows}
<p class=note>Mañjuśrī tripped Suno’s copyright filter (refunded) — needs your Suno-app ear-pick.
Famous ones for your app too: Ram, Green/White Tārā, Amitābha, Medicine Buddha.</p>
</body></html>"""

    url = put(f'{PREFIX}/review.html', html.encode('utf-8'), 'text/html; charset=utf-8')
    print('\n  ✅ REVIEW PAGE:', url)


if __name__ == '__main__':
    main()
