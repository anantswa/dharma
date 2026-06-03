# Iteration 03 — Bhagavad Gita audio learning pack (Kuber)

**Consolidated by Claude 4.8** from the Gemini 3.1 Pro + Grok 4.2 panel
(`reports/iteration-03/`). Verified live on Expo web: Learn → featured card → 12-verse
player; first verse plays (button toggles to pause).

## What changed
- **Gita audio pack** — `scripts/gen_gita_audio.py` pulls 12 iconic shlokas (2.13, 2.22, 2.47,
  2.48, 2.62, 2.63, 4.7, 4.34, 6.6, 6.19, 8.7, 18.66) from the Postgres `wisdom` table
  (Devanagari + Hindi meaning), narrates each with **Kuber** (ElevenLabs `eleven_v3`), saves
  MP3s to `assets/audio/gita/`, and emits a typed manifest `src/data/gitaShlokas.ts`.
- **`GitaAudioScreen`** — verse list with play/pause (expo-av), expand-to-read
  Sanskrit + transliteration + meaning, and a **Hindi/English** toggle. "Narrated by Kuber" footer.
- Wired into **Learn** as a featured "AUDIO · NEW" card and registered as a stack route.

## Score movement (pre-gate consolidated)

| Dimension | Wt | i01 | i02 | **i03** | Note |
|---|--:|:--:|:--:|:--:|---|
| Darshan / Ritual Loop | 20 | 4 | 4 | **4** | |
| Faith Personalization | 16 | 4 | 4 | **4** | (Gemini dissented at 2 — Christian *wisdom text* still falls back on bundled data) |
| Sensory Fidelity | 12 | 4 | 4 | **4** | |
| Asset Moat | 12 | 2 | 3 | **4** | real Kuber narration bundled + used |
| Habit & Retention | 10 | 4 | 4 | **4** | |
| Offline & Tech | 8 | 2 | 2 | **2** | baseline TS errors remain |
| Learning Quality | 8 | 4 | 3 | **4** | new audio module at depth |
| Monetization | 8 | 2 | 3 | **3** | |
| Authenticity & Trust | 4 | 1 | 3 | **3** | (Gemini 5 / Grok 2 — secret out of source vs still-shipped service key) |
| Delight & Share | 2 | 1 | 2 | **2** | |
| **Pre-gate total** | 100 | 65 | 70 | **~74** | nearing the 75 "fix-then-ship" band |
| **Gate headline** | | 49 | 49 | 49 | still blocked by ~12 baseline TS errors |

## The recurring blocker
The headline has been pinned at 49 for three iterations by the **same ~12 pre-existing TypeScript
errors** (the gate's typecheck). Clearing them is now unambiguously the highest-leverage move —
it flips the gate green and the headline jumps to ~74 (into "fix criticals, then ship").

## Top improvements for Iteration 04 (ranked)
1. **Clear the ~12 baseline TS errors** → gate passes; headline → ~74.
2. **Anon key + RLS** → live data on web + production-safe (Authenticity → 5, Faith wisdom text resolves).
3. **Seed Christian + Buddhist wisdom** into bundled data so faith content rethemes offline.
4. **Real IAP** behind the paywall (Monetization → 4–5).
5. **More audio** — extend Kuber packs (full Chalisa audio, more Gita), native background player.
