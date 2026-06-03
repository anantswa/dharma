#!/usr/bin/env python
"""Dharma critic — panel grader.

Builds a textual snapshot of the current Dharma build, runs the Build-Health gate
(secret scan + TypeScript check), then asks the Gemini 3.1 Pro + Grok 4.2 panel to
score the build against agent-framework/rubric.json and return STRICT JSON scorecards.

Raw outputs land in agent-framework/reports/iteration-NN/. Claude 4.8 (inline)
then consolidates them + its own read into reports/iteration-NN.md / .json.

Usage:
    python run_panel.py NN            # NN = zero-padded iteration number, e.g. 00
Env: reads keys from the Agentic-dharmaweave .env (GEMINI_API_KEY, XAI_API_KEY).
"""
from __future__ import annotations
import json, os, re, subprocess, sys, threading, time
from pathlib import Path

DHARMA = Path('/Users/kashyap/projects/dharma')
FW = DHARMA / 'agent-framework'
AGENTIC_ENV = Path('/Users/kashyap/projects/Agentic-dharmaweave/.env')

from dotenv import load_dotenv
load_dotenv(AGENTIC_ENV, override=True)

# ---------- snapshot ----------
KEY_FILES = [
    'App.tsx', 'app.json', 'package.json',
    'src/navigation/AppNavigator.tsx',
    'src/screens/WelcomeScreen.tsx', 'src/screens/HomeScreen.tsx',
    'src/screens/LearnScreen.tsx', 'src/screens/LessonFlowScreen.tsx',
    'src/screens/WisdomScreen.tsx', 'src/screens/CalendarScreen.tsx',
    'src/screens/SettingsScreen.tsx', 'src/screens/IapTestScreen.tsx',
    'src/store/preferencesStore.ts', 'src/store/dataStore.ts',
    'src/store/premiumStore.ts', 'src/store/musicStore.ts',
    'src/store/learnProgressStore.ts',
    'src/services/supabase.ts', 'src/services/audioService.ts',
    'src/services/notificationService.ts', 'src/services/shankhService.ts',
    'src/services/imageService.ts', 'src/services/dataSync.ts',
    'src/components/AartiPlate.tsx', 'src/components/MusicBottomSheet.tsx',
    'src/data/deityImages.ts',
]
TRUNC = 14000  # max chars per file in snapshot


def build_snapshot() -> str:
    parts = ["# DHARMA BUILD SNAPSHOT\n"]
    # file tree
    tree = subprocess.run(
        "find src App.tsx app.json package.json assets -type f "
        "! -path '*/node_modules/*' | sort",
        cwd=DHARMA, shell=True, capture_output=True, text=True).stdout
    parts.append("## File tree\n```\n" + tree + "```\n")
    # asset inventory
    inv = subprocess.run(
        "find assets -type f | sed 's|/[^/]*$||' | sort | uniq -c",
        cwd=DHARMA, shell=True, capture_output=True, text=True).stdout
    parts.append("## Asset inventory (count by dir)\n```\n" + inv + "```\n")
    # key source
    for rel in KEY_FILES:
        p = DHARMA / rel
        if not p.exists():
            parts.append(f"## {rel}\n*(missing)*\n")
            continue
        txt = p.read_text(errors='replace')
        if len(txt) > TRUNC:
            txt = txt[:TRUNC] + f"\n... [truncated {len(txt)-TRUNC} chars]\n"
        parts.append(f"## {rel}\n```tsx\n{txt}\n```\n")
    return "\n".join(parts)


# ---------- gate ----------
def run_gate() -> dict:
    notes = []
    passed = True
    # secret scan
    scan = subprocess.run(
        r"grep -rnE 'sb_secret_|service_role|sk-[A-Za-z0-9]{20}|AIza[0-9A-Za-z_-]{30}' "
        r"src App.tsx 2>/dev/null",
        cwd=DHARMA, shell=True, capture_output=True, text=True).stdout.strip()
    if scan:
        passed = False
        notes.append("LEAKED SECRET in client source:\n" + scan)
    else:
        notes.append("secret scan: clean")
    # typecheck (best-effort; don't hard-fail the run if tsc missing)
    tsc = subprocess.run(
        "npx --no-install tsc --noEmit -p tsconfig.json 2>&1 | head -40",
        cwd=DHARMA, shell=True, capture_output=True, text=True).stdout.strip()
    if 'error TS' in tsc:
        passed = False
        notes.append("TypeScript errors:\n" + tsc)
    else:
        notes.append("typecheck: " + (tsc[:200] or "no errors reported"))
    return {"passed": passed, "notes": "\n\n".join(notes)}


# ---------- panel ----------
def grade_prompt(rubric: dict, snapshot: str, gate: dict) -> str:
    return f"""You are a critic agent grading a React Native (Expo) spiritual app build
against a fixed rubric. Be rigorous and evidence-based. Cite file names / line numbers.

RUBRIC (score each dimension 0-5; weights sum to 100):
{json.dumps(rubric, indent=2)}

BUILD-HEALTH GATE RESULT (already computed by the harness):
passed={gate['passed']}
{gate['notes']}

BUILD SNAPSHOT (file tree, asset inventory, key source — truncated):
{snapshot}

Return STRICT JSON ONLY (no markdown fences), shape:
{{
  "dimensions": [{{"id": "<dim id>", "score": <0-5>, "justification": "<=2 lines",
                   "evidence": "file:line or asset ref"}}],
  "gate_passed": <bool>,
  "weighted_total": <number 0-100>,
  "top_improvements": [{{"priority": <int>, "dimension": "<id>", "action": "specific, codable instruction"}}],
  "summary": "2-3 sentence overall verdict"
}}
Compute weighted_total = sum(score/5 * weight). If gate failed, cap weighted_total at 49.
Include EVERY dimension id from the rubric. Order top_improvements by impact (priority 1 = highest)."""


def call_gemini(prompt: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
    m = genai.GenerativeModel('gemini-3.1-pro-preview')
    r = m.generate_content(prompt, generation_config={'temperature': 0.3, 'max_output_tokens': 16384})
    return r.text


def call_grok(prompt: str) -> str:
    from openai import OpenAI
    c = OpenAI(api_key=os.getenv('XAI_API_KEY'), base_url='https://api.x.ai/v1')
    r = c.chat.completions.create(model='grok-4.20-0309-reasoning',
        messages=[{'role': 'user', 'content': prompt}], max_tokens=16384, temperature=0.3)
    return r.choices[0].message.content


def extract_json(s: str):
    s = re.sub(r'^```(json)?|```$', '', s.strip(), flags=re.M).strip()
    a, b = s.find('{'), s.rfind('}')
    if a >= 0 and b > a:
        try:
            return json.loads(s[a:b+1])
        except Exception as e:
            return {"_parse_error": str(e), "_raw": s[:2000]}
    return {"_parse_error": "no json", "_raw": s[:2000]}


def main():
    it = sys.argv[1] if len(sys.argv) > 1 else '00'
    outdir = FW / 'reports' / f'iteration-{it}'
    outdir.mkdir(parents=True, exist_ok=True)
    rubric = json.loads((FW / 'rubric.json').read_text())

    print('building snapshot...')
    snap = build_snapshot()
    (outdir / 'snapshot.md').write_text(snap)
    print(f'  snapshot: {len(snap)} chars')

    print('running gate...')
    gate = run_gate()
    (outdir / 'gate.json').write_text(json.dumps(gate, indent=2))
    print(f"  gate passed={gate['passed']}")

    prompt = grade_prompt(rubric, snap, gate)
    results = {}

    def _g():
        try:
            results['gemini'] = call_gemini(prompt)
        except Exception as e:
            results['gemini'] = f'ERROR {type(e).__name__}: {e}'

    def _k():
        try:
            results['grok'] = call_grok(prompt)
        except Exception as e:
            results['grok'] = f'ERROR {type(e).__name__}: {e}'

    print('grading with gemini + grok panel...')
    ts = [threading.Thread(target=_g), threading.Thread(target=_k)]
    t0 = time.time()
    [t.start() for t in ts]; [t.join() for t in ts]
    print(f'  panel done in {time.time()-t0:.0f}s')

    for name in ('gemini', 'grok'):
        raw = results.get(name, '')
        (outdir / f'{name}_raw.txt').write_text(raw)
        parsed = extract_json(raw)
        (outdir / f'{name}.json').write_text(json.dumps(parsed, indent=2))
        wt = parsed.get('weighted_total', '?')
        print(f"  {name}: weighted_total={wt}")

    print(f'\nRaw scorecards in {outdir}')
    print('Next: Claude 4.8 consolidates -> reports/iteration-%s.md' % it)


if __name__ == '__main__':
    main()
