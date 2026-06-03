# Dharma — Build Grading Rubric (v1)

> The **contract** between the coding agent and the critic agent. Consolidated by **Claude 4.8**
> from the Gemini 3.1 Pro + Grok 4.2 + Claude panel (`consult/`). Machine-readable copy lives in
> `rubric.json` — the critic loads that; this file is the human explanation.

Each dimension is scored **0–5**. Weighted total is out of **100**. Score = Σ(score/5 × weight).

## Gate (pass/fail, checked first)
**Build Health.** The app must (a) install deps & typecheck/lint without fatal errors, (b) launch
without a crash on the first screen, and (c) contain **no leaked secrets** in client source
(no service-role keys, no private API keys). If the gate fails, the build is capped at **49/100**
regardless of dimension scores, and fixing the gate is the #1 instruction for the next iteration.

## Weighted dimensions

| # | Dimension | Weight | What the critic inspects |
|---|---|---:|---|
| 1 | **Darshan / Daily Ritual Loop** | 20 | `HomeScreen` + temple/aarti/shankh/music components. 60fps swipe (Reanimated + Gesture Handler, not core `Animated`/`ScrollView`), layered parallax temple frame, aarti haptics+particles+audio sync, persistent player, daily "prasad" + streak. |
| 2 | **Faith Personalization Depth** | 16 | Onboarding (<45s) + `preferencesStore`. Does `primaryTradition` actually transform Home, Calendar, Wisdom, Learn, palette/voice, and notifications? Any cross-faith bleed = cap this dim at 2. |
| 3 | **Sensory Fidelity** | 12 | `expo-av` audio lifecycle (preload, crossfade, clean unmount, background mode), `expo-haptics` on swipe/tap/bell, motion on UI thread. Stutter/leaks/over-haptics lower score. |
| 4 | **Asset Moat Utilization** | 12 | Real DharmaWeave assets in use (original Suno tracks, ElevenLabs narration, painterly art, graphic-novel panels, films) vs placeholders/`react-logo`. No `Linking.openURL` to YouTube/Spotify for the *core* experience. |
| 5 | **Habit & Retention Systems** | 10 | Streak engine, "Today's Practice", smart (not spammy) notifications driven by calendar/time, visible progress, local progress schema. |
| 6 | **Offline-First & Technical Excellence** | 8 | Core experience works in airplane mode; Supabase used as background sync not blocking read; large data not parsed on JS thread on launch; clean TypeScript; no obvious jank. |
| 7 | **Learning Experience Quality** | 8 | ≥2 modules at "Chalisa depth" (synced text+translit+meaning+chant audio+art+retention check). Text-dump modules score ≤2. |
| 8 | **Monetization Taste & Flow** | 8 | Native IAP (RevenueCat/expo IAP), **contextual** paywalls (inline on locked narration/audio) not just a Store tab, beautiful paywall using original art, layered SKUs per PRODUCT_SPEC, no dark patterns. |
| 9 | **Scriptural Authenticity, Safety & Trust** | 4 | Verses correct & attributed; transliteration sane; decency canon (no horror, dignified deities, uplifting register); honest privacy; no dark patterns. |
| 10 | **Delight & Shareability** | 2 | "Holy-shit" micro-moments; one-tap sacred share cards (verse+art+audio) that look native to WhatsApp/IG in dark mode. |

**Total = 100.**

## Score descriptors (apply per dimension)
- **5 — Exemplary:** matches the "great in 2026" bar in `PRODUCT_SPEC.md`; nothing material missing.
- **4 — Strong:** works well, minor polish gaps.
- **3 — Adequate:** present and functional but generic / unoptimized.
- **2 — Weak:** partially implemented or with a notable defect.
- **1 — Poor:** stub / placeholder / broken.
- **0 — Absent.**

## Ship thresholds
- **≥ 90** → ship to users.
- **75–89** → fix the critical findings, then ship.
- **< 75** → do not ship; iterate.
- **Gate failed** → capped at 49; fix the gate first.

## Output contract (what the critic returns each iteration)
A scorecard with: per-dimension score (0–5) + 1–2 line justification + evidence (file:line or
screenshot ref); the weighted total; gate result; and a **ranked, specific "Top improvements for
next iteration"** list (the teacher's notes the coding agent must act on). Stored in
`reports/iteration-NN.md` + `reports/iteration-NN.json`.
