#!/usr/bin/env python3
"""
Turn a finished chant clip into a seamless, app-length background loop.

Equal-power self-crossfade (tail→head) so the unit loops with no click, then tiled
to ~target length. Mastered gently/even per the chant canon (steady state, no
loudness war) — NOT a song master.

Usage:
  .venv/bin/python scripts/make_seamless_loop.py <input> <output.mp3> [target_sec] [xfade_sec]
"""
import subprocess
import sys
import tempfile

import librosa
import numpy as np
import soundfile as sf


def seamless(y: np.ndarray, sr: int, target_sec: float, xfade: float) -> np.ndarray:
    if y.ndim == 1:
        y = y[:, None]
    n = y.shape[0]
    L = min(int(xfade * sr), n // 4)
    t = np.linspace(0, 1, L)
    fo = np.cos(t * np.pi / 2)[:, None]
    fi = np.sin(t * np.pi / 2)[:, None]
    head, tail = y[:L], y[-L:]
    seam = tail * fo + head * fi                    # bridges end → start
    unit = np.concatenate([seam, y[L:-L]], axis=0)  # loops seamlessly, internally continuous
    reps = max(1, int(np.ceil(target_sec * sr / unit.shape[0])))
    out = np.tile(unit, (reps, 1))[: int(target_sec * sr)]
    peak = float(np.max(np.abs(out))) or 1.0
    return out * (0.89 / peak)                       # gentle, even — not loudness-war


def main() -> None:
    inp, outp = sys.argv[1], sys.argv[2]
    target_sec = float(sys.argv[3]) if len(sys.argv) > 3 else 180.0
    xfade = float(sys.argv[4]) if len(sys.argv) > 4 else 2.0

    y, sr = librosa.load(inp, sr=44100, mono=False)
    y = y.T if y.ndim > 1 else y                      # → (n, ch)
    loop = seamless(y, sr, target_sec, xfade)

    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        sf.write(tmp.name, loop, sr)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp.name,
                        '-b:a', '192k', outp], check=True)
    print(f'✓ {outp}  ({loop.shape[0] / sr:.0f}s seamless loop)')


if __name__ == '__main__':
    main()
