# Time Navigator — "The Weather of Time" · Feature Brief

**From:** Maya (astrology thread) · **For:** the Dharma app thread · **Date:** 2026-08-27
**Sponsor:** Anant. Companion to `JYOTISH_MODULE_BRIEF.md` (the learning module teaches the *grammar*; this feature is the *daily use*). Read both; they share the birth-data component, the privacy stance, the image-cost rules, and the quality gate.

## The idea, in Anant's words

Help people **navigate time**: see which periods are commonly good or difficult — for the world and for themselves — understand *why* a period is coming and what it means, and plan a little into the future. The founding question a user should be able to answer in one glance: **"are we getting toward the end of a difficult period?"**

The register throughout: *seasons, not dates; weather, not fate.* A user should leave every screen oriented, never spooked.

## What already exists (do not rebuild)

The astrology thread has a working computation layer, verified against 46-year-old hand-cast charts to the arc-second:

- `lab/jyotish_engine.py` — personal layer: natal chart, Vimshottari daśā tree, transits, sade sati (Swiss Ephemeris, sidereal Lahiri).
- `lab/mundane_engine.py` — world layer: **world tension index** (slow-planet hard-aspect geometry, 1980→2032), historical crisis backtest, forward dense-window detection (≥p80 gate), Jupiter–Saturn cycle, eclipse seasons, McWhirter nodal cycle.
- A reference dashboard already renders both: lab portal → Jyotish + World Clock tabs. Steal its information design freely — the World Clock page's hero strip ("two clocks": world eras over personal daśās) is the overlay pattern Surface 3 wants.

Port or serve these; do not re-derive from blogs. Pañchāṅga (tithi/nakshatra/vāra) is a small extension of the same Swiss Ephemeris layer — **Maya delivers it precomputed** (see data contracts); the app never computes astronomy from scratch.

## Feature shape (three surfaces)

### 1. Today — the daily card
- **Pañchāṅga strip** (Delhi default; device-local sunrise opt-in later): tithi, nakshatra, vāra, each with a one-line plain-language meaning from the copy bank. This is the daily-retention hook — devotional users check it like weather.
- **World weather dial**: today's tension-index percentile as a calm gauge ("the slow sky is quiet" / "a dense season"), with the one-sentence *why* ("Saturn squares Pluto within 2° through July").
- Eclipse-season badge when active.
- *Done when:* a cold user answers "is the sky calm today?" in under five seconds, and the card renders fully offline from the bundled data.

### 2. Seasons — the world timeline (the founding question)
- The tension-index curve, past → horizon, with historical events marked (COVID, 2008, 9/11…) and future dense windows shaded — the lab World Clock chart, mobile-redesigned (smoothed line over faint raw, exactly as the lab renders it; the numbers are the engine's, untouched).
- Each window tappable → a pre-written copy block: *what this geometry is · what seasons like it looked like before · how the tradition reads it · what such a season is for* (the agency line — structurally required, see contracts). Education links into the Jyotish module's relevant unit (gochara = unit 7).
- **Honesty is a product feature**: ship the hits AND misses table (10 of 11 crises elevated within ±90 days; day-of readings missed several — say so).
- *Done when:* the founding question is answerable from the top of the screen in one glance (see the calibration line at the end of this brief), and every shaded window opens a complete copy block.

### 3. My Time — the personal layer (opt-in, birth data on-device only)
- User's current mahā/antar-daśā with plain-language meaning and end-date ("your Venus antara runs to Sep 2027 — a repair season").
- Personal + world overlay: the "two clocks" strip — "the world's next dense window overlaps your Saturn antara — a season for consolidation, not launches."
- Sade Sati status (honestly framed — no fear content, no remedy-selling).
- Notifications (opt-in, see copy rules): period boundaries, eclipse seasons, dense-window entries.
- *Done when:* the shared birth-data component exists (built once, used by both this and the Jyotish module's "your chart" mode), and the unknown-birth-time flow below is implemented. Ships after Surfaces 1–2.

## Data contracts (sketch — app thread owns the final schema)

**`world.json`** — identical for all users; bundled with the app, refreshed remotely (weekly is plenty; the index moves slowly). Versioned; app keeps last-good copy.

```json
{
  "version": "2026-08-27", "horizon": "2032-12-31",
  "series": { "start": "1980-01-01", "step_days": 5, "values": [0.42, "..."] },
  "gates": { "p50": 0.55, "p80": 0.95 },
  "events": [ { "date": "2020-03-11", "label": "COVID pandemic declared",
                "day_pct": 75, "window_pct": 90, "window_date": "2020-04-05",
                "drivers": "Jupiter–Pluto conj, Saturn–Uranus square" } ],
  "windows": [ { "start": "2028-06-12", "end": "2028-07-12", "peak_date": "2028-06-22",
                 "peak_pct": 88, "drivers": "Saturn–Pluto square", "copy_id": "w_2028_satplu" } ],
  "eclipse_seasons": [ ["2026-08-27", "2026-09-10"] ],
  "copy": { "w_2028_satplu": { "what": "…", "history": "…", "tradition": "…", "agency": "…" } }
}
```

Schema rule: a window without a populated `agency` field fails validation — hard rule 1 is structural, not editorial.

**`panchanga.json`** — Maya-delivered rolling ~400-day table (Delhi sunrise): `{ date, tithi: {name, paksha, meaning}, nakshatra: {name, meaning}, vara }`. Meanings come from the audited copy bank, not generated at runtime.

**Personal layer** — computed on-device from `{ birth_date, birth_time?, place }` via the ported engine (sweph npm / WASM, same Lahiri config as the lab — port from `jyotish_engine.py`, verify against its outputs). Output shape: daśā tree `{ mahadashas: [{lord, start, end, antardashas: […]}], sade_sati }`. **No network call ever carries birth data or derived periods.**

## Copy register + notification bank

Every difficult-period surface carries the agency frame: what this season is *for*. The lab's register: scores and seasons are "climate, not verdict."

Ship-quality examples:
- "Your Venus antardaśā ends Tuesday — a Sun year begins: visibility season. See what shifts →"
- "The sky gets busier from June — Saturn squares Pluto. Seasons like this reward consolidation. Read the season →"
- "Eclipse season opens today, through Sep 10. The tradition treats these two weeks as accelerants — good for finishing, not launching."

Never-ship patterns (reject in review, no exceptions): warning emoji, countdowns to difficult periods, "brace yourself / be careful," unsolicited remedy prompts, anything that would read as a threat if a child saw it. Push cadence: daytime local hours only, batched, and silent by default for dense-window entries (badge, not alert).

## Edge cases (decide these before build, not in code review)

1. **Unknown or approximate birth time** — the common case. The Moon moves ~13°/day; if it stays within one nakshatra across the whole birth *date*, the daśā sequence is solid: compute from noon, show normally with a small "date-precision" note. If the Moon crosses nakshatras that day, do NOT guess: show the two candidate daśā timelines side by side ("born before ~14:10 → this; after → that") and let the user pick what matches their life, or stay world-only. Never silently pick one.
2. **No birth data** — Surfaces 1–2 fully functional; My Time shows a calm invitation, not a nag.
3. **Data horizon** — the index ends 2032. Beyond it, say "horizon" honestly; the app never extrapolates. Extending the series is a Maya deliverable (regenerate `world.json`), not an app-side computation.
4. **Stale world data** — offline is fine (bundled copy); after 30 days without refresh, show a quiet "as of {date}" stamp. Never block the card on network.
5. **Daśā boundary in progress** — within ±7 days of a period change, show the transition state ("Venus hands over to the Sun this week") instead of pretending a hard edge.
6. **Location for pañchāṅga** — tithi timing is location-independent, but which *day* it maps to depends on sunrise: v1 = Delhi table; device-local sunrise is a labeled later phase, not a silent default.
7. **Deletion** — deleting birth data wipes the daśā cache and any scheduled personal notifications in the same action.

## Hard rules (canon — none of these are negotiable)

1. **No fatalism, no fear, no doom copy.** Every difficult-period screen carries agency framing: what this season is *for* (the lab's register: scores are "climate, not verdict"). If it would scare a child, don't ship it.
2. **No financial advice.** The world layer NEVER says buy/sell/market-direction. It's a weather lens; add the standard disclaimer. (Anant's personal market use lives in his private lab, not the app.)
3. **Privacy:** birth data on-device; personal computations local or anonymous; nothing to analytics. Opt-in only, per the app's standing privacy stance; update the ASC declaration if data practices change.
4. **Images:** Grok Imagine for bulk (season illustrations, graha art), gpt-image-2 for ≤12 hero images, DharmaWeave style bible (Cosmic Gold), nothing horror-coded — Rāhu/Ketu as celestial geometry, never monsters. **HARD STOP (account-level, locked 2026-05-25): no OpenAI text/reasoning models for anything** — copy, quiz text, brainstorming, nothing; never set `reasoning_effort`.
5. **Accuracy:** Maya audits all displayed claims against the engines before ship. All in-app astrology copy is pre-written and audited — nothing generated on-the-fly in production.

## Non-goals (v1)

No market or finance layer of any kind; no generic sun-sign horoscopes; no on-the-fly generated readings; no social sharing of personal charts; no remedy commerce, ever. Anant's own chart never appears in shipped content (same rule as the Jyotish module).

## Quality gate

Recursive build-grade loop, gate ≥9.0: accuracy (engine-audited), calm-clarity of copy (would a non-astrology user feel *oriented*, not spooked), engagement (does Anant check it daily — he is user zero), visual quality. Ship publicly only after Anant has lived with it and says go.

## Sequencing

1. App thread: respond with the final data-contract schema (the sketch above is the starting point) + where precompute runs.
2. Maya: delivers `world.json` (index series, windows, events, copy blocks — agency fields populated) + `panchanga.json` + the notification copy bank.
3. Pilot: Surface 1 (Today card) + Surface 2 (Seasons timeline), world-only. Grade against the gate; iterate.
4. Surface 3 follows once the Jyotish module's shared birth-data component exists (build once, both features use it), with the unknown-time flow in place before launch.

*The one-glance answer, as of this writing, for calibration: "The 2020–23 storm is over; the sky is quiet into 2028; the next dense era is Jun 2028 → late 2031." The app should always be able to say something this plain.*
