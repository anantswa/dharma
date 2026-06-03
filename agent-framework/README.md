# Dharma — Agent Framework

A two-agent build loop for finishing the Dharma app: a **Coding Agent** builds on the existing
codebase; a **Critic Agent** grades each build against a fixed rubric and returns ranked
improvement notes. The rubric and product definition were set by a **three-model panel**
(Gemini 3.1 Pro + Grok 4.2 + Claude 4.8), consolidated by Claude 4.8.

```
        ┌─────────────────────────────────────────────────────────┐
        │  PRODUCT_SPEC.md   ← what we're building (panel-derived)  │
        │  RUBRIC.md / .json ← how a build is graded (the contract) │
        └─────────────────────────────────────────────────────────┘
                 │                                   ▲
                 ▼                                   │ scorecard + teacher's notes
   ┌──────────────────────┐   submit build    ┌───────────────────────────────┐
   │  CODING AGENT         │ ────────────────► │  CRITIC AGENT                 │
   │  (Claude 4.8 / Code)  │                   │  panel: Gemini + Grok,        │
   │  builds on existing   │ ◄──────────────── │  consolidated by Claude 4.8   │
   └──────────────────────┘   top improvements└───────────────────────────────┘
```

## Layout
- `PRODUCT_SPEC.md` — consolidated product definition + revenue stack.
- `RUBRIC.md` / `rubric.json` — the grading contract (10 weighted dims + a Build-Health gate).
- `consult/` — raw panel transcripts that produced the spec + rubric.
- `critic/run_panel.py` — snapshots the build, runs the gate, grades with Gemini + Grok.
- `coding-agent/CODING_AGENT.md` — the coding-agent protocol (the loop).
- `reports/iteration-NN.md|.json` — consolidated grade per iteration; `reports/iteration-NN/`
  holds the raw per-model scorecards + snapshot + gate result.

## Run a grade
```bash
/Users/kashyap/projects/Agentic-dharmaweave/.venv/bin/python \
  agent-framework/critic/run_panel.py NN   # NN = 00, 01, ...
```
Keys (`GEMINI_API_KEY`, `XAI_API_KEY`) load from the Agentic-dharmaweave `.env`.
Approved models only: Gemini 3.1 Pro, Grok 4.2, Claude 4.8 inline. **No OpenAI/GPT** (per
global canon — xAI/Grok is reached via the OpenAI-compatible SDK but is *not* OpenAI).

## Status
- **Iteration 00 (baseline):** pre-gate ≈ 53 (gate-capped 49 — Supabase key in source).
- **Iteration 01:** pre-gate **65** — faith identity system, darshan haptics + streak/Prasad, share.
- **Iteration 02:** pre-gate **~70** — Christian + Buddhist temple art (3 real darshans),
  contextual Paywall + product catalog, Reanimated parallax, visual share cards, and the
  Supabase key fixed (stale char) + moved to config. Secret scan now CLEAN; gate blocked only
  by ~12 baseline TS errors. See `reports/iteration-02.md`.
- **Iteration 03:** pre-gate **~74** — Bhagavad Gita audio learning pack: 12 iconic shlokas
  pulled from Postgres, narrated by Kuber (ElevenLabs), in a Hindi/EN player wired into Learn.
  Real asset-moat audio now bundled. See `reports/iteration-03.md`.
- **Data:** key works server-side/native; browser blocks the *service* key on web — an
  anon key + RLS makes web + production both green.
- **Iteration 04:** cleared all ~12 baseline TS errors → **gate PASSES**. First un-capped
  headline: **~77/100** (Gemini 72.8 · Grok 82) — now in the 75–89 "fix criticals, then ship"
  band. See `reports/iteration-04.md`. Remaining criticals: anon key, real IAP, seed faith wisdom.
