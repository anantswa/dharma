# Coding Agent — protocol

The coding agent is **Claude 4.8 (Claude Code)** working in `/Users/kashyap/projects/dharma`.
It builds *on top of* what exists; it never rewrites from scratch.

## Loop (one iteration = NN)
1. **Read the brief.** Load `PRODUCT_SPEC.md`, `RUBRIC.md`, and the latest
   `reports/iteration-(NN-1).md` — especially the ranked **Top improvements** list. Those are
   the teacher's notes; treat them as the work order, top priority first.
2. **Plan.** Pick the highest-impact subset achievable this iteration (favor the gate + the
   heaviest-weight dimensions). Note what you're explicitly deferring.
3. **Build.** Implement on the existing codebase. Keep diffs reviewable. Match house style
   (dark/gold, Playfair, Zustand, Expo). Use real DharmaWeave assets, never placeholders.
4. **Self-check.** `npx tsc --noEmit` clean; no leaked secrets; app launches (Expo web at minimum).
5. **Submit for grading.** Run the critic:
   ```
   /Users/kashyap/projects/Agentic-dharmaweave/.venv/bin/python \
     agent-framework/critic/run_panel.py NN
   ```
   Then consolidate the panel into `reports/iteration-NN.md` + `.json` (Claude is lead grader).
6. **Act on feedback.** The new Top-improvements list seeds iteration NN+1. Repeat until
   score ≥ 90 (ship) or Anant calls it.

## Rules
- The **gate is sacred**: never (re)introduce a leaked secret; keep typecheck clean.
- Don't optimize for the rubric at the expense of the product — the rubric serves
  `PRODUCT_SPEC.md`, not vice-versa. If a rubric item is wrong, flag it to Claude-the-consolidator
  rather than gaming it.
- Honor DharmaWeave canon: scriptural accuracy, decency (no horror, dignified deities), uplifting
  register, no dark-pattern paywalls.
- Commit per iteration with message `iteration NN: <summary> (score <prev>→<new>)` — only when
  Anant has said to commit/push.
