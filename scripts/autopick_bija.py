# -*- coding: utf-8 -*-
"""
Auto-process the remaining bīja mantras (take A): pick a clean 30s window
(skip intro + end-fade via RMS energy), seamless-loop it, write the app master.
Anant then spot-fixes any in the app with exact in/out.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

CAND = Path('/Users/kashyap/Library/CloudStorage/GoogleDrive-kashyap@tara-ventures.com/'
            'Shared drives/DharmaWeave/Creative & Content/Music/Studies/_app_candidates')
OUT = Path('/Users/kashyap/projects/Agentic-dharmaweave/output/deity_mantras')
OUT.mkdir(parents=True, exist_ok=True)

KEYS = [
    'om_ham_hanumate_namah', 'om_shreem_mahalakshmiyei', 'navarna_chamundayai',
    'om_aim_saraswatyai_namah', 'om_krim_kalyai_namah', 'om_sharavanabhavaya_namah',
    'om_suryaya_namah', 'om_brahmane_namah', 'buddham_saranam', 'shakyamuni',
]
WIN = 30.0       # window length (s)
SKIP_HEAD = 10.0  # ignore the first 10s (intro/ramp)
TAIL_PAD = 2.0    # keep 2s clear of the end (Suno end artifacts)


def best_window(y, sr):
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    hop_s = 512 / sr
    dur = len(y) / sr
    if dur <= WIN + TAIL_PAD:
        return 0.0, dur
    w = int(WIN / hop_s)
    lo = int(SKIP_HEAD / hop_s)
    hi = len(rms) - w - int(TAIL_PAD / hop_s)
    if hi <= lo:
        return SKIP_HEAD, SKIP_HEAD + WIN
    # smooth + pick the steadiest-loud window (high mean, low dropouts)
    csum = np.cumsum(np.insert(rms, 0, 0))
    means = (csum[lo + w:hi + w] - csum[lo:hi]) / w
    start = (lo + int(np.argmax(means))) * hop_s
    return start, start + WIN


def seamless(y, sr, target_sec=120.0, xfade=1.5):
    if y.ndim == 1:
        y = y[:, None]
    n = y.shape[0]
    L = min(int(xfade * sr), n // 4)
    t = np.linspace(0, 1, L)
    fo, fi = np.cos(t * np.pi / 2)[:, None], np.sin(t * np.pi / 2)[:, None]
    seam = y[-L:] * fo + y[:L] * fi
    unit = np.concatenate([seam, y[L:-L]], axis=0)
    reps = max(1, int(np.ceil(target_sec * sr / unit.shape[0])))
    out = np.tile(unit, (reps, 1))[:int(target_sec * sr)]
    return out * (0.89 / (float(np.max(np.abs(out))) or 1.0))


def main():
    for key in KEYS:
        src = CAND / key / f'{key}_A.mp3'
        if not src.exists():
            print(f'  ⚠️  missing {key}_A.mp3', file=sys.stderr); continue
        y, sr = librosa.load(str(src), sr=44100, mono=True)
        s, e = best_window(y, sr)
        seg = y[int(s * sr):int(e * sr)]
        loop = seamless(seg, sr)
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            sf.write(tmp.name, loop, sr)
            outp = OUT / f'{key}.mp3'
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp.name,
                            '-b:a', '192k', str(outp)], check=True)
        print(f'  ✅ {key:30s} A {s:.0f}–{e:.0f}s → {outp.name}')


if __name__ == '__main__':
    main()
