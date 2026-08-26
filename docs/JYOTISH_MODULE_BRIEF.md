# Jyotish Basics — Learning Module Brief

**From:** Maya (the astrology thread) · **For:** the Dharma app thread · **Date:** 2026-08-26
**Sponsor:** Anant. Read this whole brief before design work; it carries context and hard rules from months of the astrology thread.

## The idea, in Anant's words

An interactive, game-like learning module teaching **the basics of Vedic astrology from first principles** — houses, planets, signs, nakshatras, daśās — with quizzes throughout. **Design target: Anant himself.** He wants to *enjoy learning* this. If it's engaging enough that he finishes it and it holds, we ship it to everyone; if he drops it, it isn't done. He is user zero and the quality gate in person.

## Why Maya writes the content (division of labor)

The astrology thread has spent weeks building verified ground truth: a Swiss-Ephemeris computation engine, a four-source-verified natal chart, daśā mathematics, transit calendars. Jyotish content on the internet is ~70% garbled; **accuracy is the moat.** So:

- **Maya (astrology thread):** curriculum, all lesson content, quiz banks, worked examples, image prompt sets. Content will be delivered as structured JSON per the schema you define.
- **Dharma app thread:** module UX, game mechanics, quiz engine, progression/streaks, rendering, shipping. You own how it feels; Maya owns that it's true.
- Reference implementation for all calculations: `~/projects/Agentic-dharmaweave/lab/jyotish_engine.py` (pure functions, Swiss Ephemeris, sidereal Lahiri). Port or precompute — do not re-derive formulas from blogs.

## Curriculum (9 units — the count is thematic, embrace it)

1. **The Sky Wheel** — the zodiac as a 360° circle; 12 rāśis, their elements and qualities; sidereal vs tropical in one honest screen (we use sidereal/Lahiri; say why without dogma).
2. **The Nine Grahas** — Sun through Saturn + Rāhu/Ketu (the two nodes — geometry first, mythology second); what each *signifies*; natural benefic/malefic.
3. **The Twelve Bhavas (houses)** — what each house governs; the lagna as the wheel's anchor; kendras and trikonas; why house ≠ sign.
4. **Lordship — the chart becomes a web** — every sign has a lord; every house therefore has a lord living somewhere; functional benefic/malefic *by lagna* (the aha: Jupiter is not "good" for everyone). This unit is the conceptual heart.
5. **Nakshatras — the 27-fold moon wheel** — 27 lunar mansions, 9 lords repeating ×3 (mod-9 arithmetic — teach it as the beautiful pattern it is); padas; the learner's own janma nakshatra as hook.
6. **Daśās — the timetable** — Vimshottari from first principles: Moon's nakshatra → starting lord → the fixed 120-year sequence; mahā/antar/pratyantar nesting as fractal; compute one by hand once, then let the app compute.
7. **Gochara (transits)** — slow planets as weather fronts; Saturn cycles, Jupiter cycles, the nodes; Sade Sati explained without fear-mongering.
8. **Yogas — patterns in the web** — a curated dozen (Pancha Mahāpuruṣa, Gaja-Kesari, Budha-Āditya, parivartana/exchange, dhana combinations); "spot the yoga" is the natural game here.
9. **Capstone: Read a Chart** — cast a full chart and walk a structured reading: lagna → lords → strong/weak → current daśā → transits. Learner leaves able to *read*, not just recite.

## The engagement engine (what makes it a game)

- **"Your own chart" mode — the killer feature.** Learner enters birth date/time/place once; every lesson's examples personalize ("YOUR Moon is in Rohini — so your first daśā lord was…"). Nothing on earth teaches Jyotish this way. Implementation: on-device or server compute (sweph npm / WASM port of Swiss Ephemeris, or a precompute endpoint); learner birth data is **sensitive — store on-device, never in analytics** (consistent with the app's opt-in-only privacy stance).
- Quiz mechanics per unit: drag-graha-to-house games, "which house is this?" flash rounds, spot-the-yoga chart puzzles, daśā-math challenges, spaced-repetition review decks, streaks aligned with the app's existing patterns.
- Sample charts for public content: **synthetic or long-dead historical figures only.** Anant's own chart is private and never appears in shipped content.
- Tone: the astrology thread's register — wonder + honesty. Every unit distinguishes *computed fact* (ephemeris math), *classical craft* (rules from texts), and *interpretation*. No fatalism, no fear content, no "remedy selling." A learner should leave more curious and less superstitious.

## Images — cost rules (canon, do not deviate)

- **Bulk engagement art (unit covers, quiz illustrations, graha personifications): Grok Imagine.** This is the ~75% cost cut Anant asked for, and matches the standing bake-off verdict (Grok = bulk-only).
- **gpt-image-2 only for the handful of hero images** where quality visibly matters (module cover, the nine graha portrait set). Per-image ~$0.17.
- **HARD STOP (account-level, locked 2026-05-25): no OpenAI text/reasoning models for anything** — content, brainstorming, quiz generation, nothing. Maya + Gemini only for any generative text work. Never set `reasoning_effort`.
- All art follows the DharmaWeave visual style bible (Cosmic Gold palette is the natural fit); painterly, no neon, nothing that would scare a child — graha imagery included (Rāhu/Ketu as celestial geometry, not horror serpents).

## Quality gate

Recursive build-grade loop, per standing practice: build → harsh grade against a rubric → iterate, **gate ≥ 9.0**. Rubric dimensions: accuracy (Maya audits every claim against the engine), engagement (does Anant keep coming back), pedagogy (can a learner cast-and-read by the capstone), visual quality. Public release only after Anant completes the full module himself and says ship.

## Sequencing proposal

1. App thread: respond to this brief with the content JSON schema + module framework constraints.
2. Maya: delivers Unit 1 + Unit 2 content complete (lessons, quiz banks, image prompts) as the pilot.
3. App thread: builds the pilot vertical slice; Anant plays it.
4. Grade, iterate to gate, then production of Units 3–9.

*Anant's one-line vision, verbatim: "I wanna make something for myself so that I enjoy learning and then put it out for others as well."*
