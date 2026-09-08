#!/usr/bin/env node
/**
 * validate_vidya_cards.js — check Mantra Vidyā lesson JSON before it ships.
 *
 *   node scripts/validate_vidya_cards.js [dir-or-file ...]
 *   default: /Users/kashyap/projects/Agentic-dharmaweave/content/mantra_vidya/batch1
 *
 * Two tiers, both reported per card:
 *   LOADER  — mirrors isMantraLesson() in src/data/vidya/index.ts exactly. A
 *             card that fails here is silently DROPPED by the app (never the
 *             shelf), so these are the ones that matter for "does it open".
 *   SCHEMA  — the stricter shape in src/data/vidya/types.ts (enum values,
 *             importance/gap 1–5, words[] fields, practice.mode array, etc.).
 *             The app tolerates most of these, but a wrong one renders as
 *             "undefined" or, for practice.mode-as-string, crashes screen 6.
 *   WARN    — content-quality nudges (§8 bang line, sayItLike diacritics,
 *             t0/t1 monotonic, alsoIn ids resolving, duplicate ids).
 *
 * Exit code 1 when any LOADER or SCHEMA error is found. Pure Node, no deps.
 * Keep the LOADER block in lock-step with isMantraLesson() — do not import it.
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_DIR = '/Users/kashyap/projects/Agentic-dharmaweave/content/mantra_vidya/batch1';

// ── enums straight from types.ts ─────────────────────────────────────────────
const CLASSES = ['bija', 'mula', 'vedic', 'opener', 'buddhist', 'nama'];
const TRADITIONS = ['Hindu', 'Buddhist', 'Sikh', 'Jain'];
const SHELVES = ['start', 'bija', 'deity', 'vedic', 'peace', 'buddhist'];
const CONFIDENCE = ['located', 'located (tantric text, dated)', 'traditional', 'traditional (modern commentary)', 'contested'];
const MODES = ['aloud', 'whispered', 'mental'];
const VOICES = ['kuber', 'devi_female'];
const RANK = [1, 2, 3, 4, 5];

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const hasDiacritics = (s) => /[āīūṛṝḷḹṃṁḥṅñṭḍṇśṣ]/i.test(s);

// ── LOADER tier: mirror of isMantraLesson() ──────────────────────────────────
function loaderErrors(l) {
  const e = [];
  if (!isObj(l)) return ['not a JSON object'];
  const req = (k, ok, why) => { if (!ok) e.push(`${k}: ${why}`); };
  req('id', isStr(l.id), 'non-empty string required');
  req('titleHi', isStr(l.titleHi), 'non-empty string required');
  req('titleEn', isStr(l.titleEn), 'non-empty string required (this IS the bang line, §8)');
  req('sanskrit', isStr(l.sanskrit), 'non-empty string required');
  req('transliteration', isStr(l.transliteration), 'non-empty string required');
  req('meaningHi', typeof l.meaningHi === 'string', 'string required (may be empty)');
  req('meaningEn', typeof l.meaningEn === 'string', 'string required (may be empty)');
  req('class', isStr(l.class), 'non-empty string required');
  req('tradition', isStr(l.tradition), 'non-empty string required');
  req('shelf', isStr(l.shelf), 'non-empty string required');
  req('sayItLike', typeof l.sayItLike === 'string', 'string required (may be empty)');
  req('words', Array.isArray(l.words), 'array required');
  req('audio', isObj(l.audio), 'object required');
  if (isObj(l.audio)) {
    req('audio.spokenSlow', isStr(l.audio.spokenSlow), 'non-empty string required');
    req('audio.spokenNatural', isStr(l.audio.spokenNatural), 'non-empty string required');
  }
  req('source', isObj(l.source), 'object required');
  req('significance', isObj(l.significance), 'object required');
  req('practice', isObj(l.practice), 'object required');
  return e;
}

// ── SCHEMA tier: the full MantraLesson shape from types.ts ───────────────────
function schemaErrors(l, fileStem) {
  const e = [];
  if (!isObj(l)) return e;
  const oneOf = (k, v, list) => { if (v !== undefined && !list.includes(v)) e.push(`${k}: "${v}" not one of ${JSON.stringify(list)}`); };
  const optStr = (k, v) => { if (v !== undefined && typeof v !== 'string') e.push(`${k}: must be a string when present`); };

  if (isStr(l.id) && fileStem && l.id !== fileStem) e.push(`id "${l.id}" does not match file name "${fileStem}.json" (loader fetches lessons/<id>.json)`);
  oneOf('class', l.class, CLASSES);
  oneOf('tradition', l.tradition, TRADITIONS);
  oneOf('shelf', l.shelf, SHELVES);
  optStr('deityId', l.deityId);
  if (!RANK.includes(l.importance)) e.push(`importance: must be 1–5 (got ${JSON.stringify(l.importance)})`);
  if (!RANK.includes(l.gap)) e.push(`gap: must be 1–5 (got ${JSON.stringify(l.gap)})`);
  optStr('artUrl', l.artUrl);

  if (Array.isArray(l.words)) {
    l.words.forEach((w, i) => {
      const p = `words[${i}]`;
      if (!isObj(w)) { e.push(`${p}: must be an object`); return; }
      for (const k of ['deva', 'iast', 'glossEn', 'glossHi']) if (!isStr(w[k])) e.push(`${p}.${k}: non-empty string required`);
      for (const k of ['root', 'grammar', 'audioUrl']) optStr(`${p}.${k}`, w[k]);
      for (const k of ['t0', 't1']) if (w[k] !== undefined && !isNum(w[k])) e.push(`${p}.${k}: must be a number (ms) when present`);
      if ((w.t0 === undefined) !== (w.t1 === undefined)) e.push(`${p}: t0 and t1 must be given together`);
      if (isNum(w.t0) && isNum(w.t1) && !(w.t1 > w.t0)) e.push(`${p}: t1 (${w.t1}) must be > t0 (${w.t0}) — a zero/negative slice never plays`);
      if (w.alsoIn !== undefined && !(Array.isArray(w.alsoIn) && w.alsoIn.every(isStr))) e.push(`${p}.alsoIn: must be an array of lesson ids`);
    });
  }

  if (isObj(l.audio)) {
    optStr('audio.loopKey', l.audio.loopKey);
    optStr('audio.master', l.audio.master);
    if (!VOICES.includes(l.audio.voice)) e.push(`audio.voice: must be one of ${JSON.stringify(VOICES)} (got ${JSON.stringify(l.audio.voice)})`);
    for (const k of ['spokenSlow', 'spokenNatural', 'master']) {
      const v = l.audio[k];
      if (isStr(v) && !/^https?:\/\//.test(v)) e.push(`audio.${k}: must be an absolute http(s) URL (streamCache) — got "${v}"`);
    }
  }
  if (isObj(l.source)) {
    if (!isStr(l.source.text)) e.push('source.text: non-empty string required');
    if (!isStr(l.source.ref)) e.push('source.ref: non-empty string required');
    if (!CONFIDENCE.includes(l.source.confidence)) e.push(`source.confidence: "${l.source.confidence}" not one of ${JSON.stringify(CONFIDENCE)}`);
    optStr('source.note', l.source.note);
  }
  if (isObj(l.significance)) {
    for (const k of ['textSays', 'traditionSays', 'weDoNotClaim']) if (!isStr(l.significance[k])) e.push(`significance.${k}: non-empty string required (§3 screen 5 — every card carries all three)`);
  }
  if (isObj(l.practice)) {
    const c = l.practice.count;
    if (!(c === 'once' || (isNum(c) && c > 0))) e.push(`practice.count: must be a positive number or "once" (got ${JSON.stringify(c)})`);
    optStr('practice.timeOfDay', l.practice.timeOfDay);
    if (!Array.isArray(l.practice.mode)) e.push(`practice.mode: must be an ARRAY of ${JSON.stringify(MODES)} — a string here crashes screen 6 (.join)`);
    else l.practice.mode.forEach((m, i) => oneOf(`practice.mode[${i}]`, m, MODES));
    optStr('practice.dikshaNote', l.practice.dikshaNote);
  }
  if (l.quiz !== undefined) {
    if (!Array.isArray(l.quiz)) e.push('quiz: must be an array when present');
    else l.quiz.forEach((q, i) => {
      const p = `quiz[${i}]`;
      if (!isObj(q)) { e.push(`${p}: must be an object`); return; }
      if (!isStr(q.prompt)) e.push(`${p}.prompt: non-empty string required`);
      if (!(Array.isArray(q.options) && q.options.length >= 2 && q.options.every(isStr))) e.push(`${p}.options: array of ≥2 strings required`);
      if (!(Number.isInteger(q.correct) && Array.isArray(q.options) && q.correct >= 0 && q.correct < q.options.length)) e.push(`${p}.correct: must index into options`);
    });
  }
  return e;
}

// ── WARN tier: content nudges, never fatal ───────────────────────────────────
function warnings(l, allIds) {
  const w = [];
  if (!isObj(l)) return w;
  if (isStr(l.titleEn)) {
    if (l.titleEn.length > 110) w.push(`titleEn is ${l.titleEn.length} chars — the bang must land in ten seconds (§8); aim under ~90`);
    if (/^(the |a |an )?[^ ]+ (mantra|mantr|sūkta|stotra)\b/i.test(l.titleEn) && !/ is | are |—|:/.test(l.titleEn)) w.push('titleEn reads like a label, not a connection ("Śrīṃ is Lakṣmī") — §8');
  }
  if (isStr(l.sayItLike) && hasDiacritics(l.sayItLike)) w.push('sayItLike carries diacritics — it is the beginner roman line, no diacritics (§3 screen 2)');
  if (Array.isArray(l.words)) {
    if (l.words.length === 0) w.push('words[] is empty — screen 3 shows a placeholder and recall degrades');
    let last = -1;
    l.words.forEach((x, i) => {
      if (isObj(x) && isNum(x.t0) && isNum(x.t1)) {
        if (x.t0 < last) w.push(`words[${i}].t0 (${x.t0}) is before the previous word's t1 (${last}) — offsets should be monotonic`);
        last = x.t1;
      }
      if (isObj(x) && Array.isArray(x.alsoIn)) x.alsoIn.forEach((id) => { if (!allIds.has(id)) w.push(`words[${i}].alsoIn "${id}" is not among the cards being validated (sheet silently hides it)`); });
    });
    const withT = l.words.filter((x) => isObj(x) && isNum(x.t0)).length;
    if (withT && withT !== l.words.length) w.push(`${withT}/${l.words.length} words carry t0/t1 — word-sync highlight will skip the rest`);
  }
  if (l.class === 'bija' && !l.deityId) w.push('bīja card without deityId — SeedEar/SeedMatch fall back to titleHi, no deity art');
  if (l.class === 'vedic' && isObj(l.source) && l.source.confidence !== 'located') w.push(`vedic card with confidence "${l.source.confidence}" — expected "located"`);
  if (isObj(l.audio) && l.audio.voice === 'devi_female' && !/dev|lak|sar|kal|dur|hrim|shrim|klim|aim|krim|navarna/i.test(String(l.id))) w.push('voice devi_female on a card whose id does not look like a Devī lesson');
  if (l._fixture) w.push('carries a _fixture marker — development card, not graded content');
  return w;
}

// ── run ──────────────────────────────────────────────────────────────────────
function collectFiles(args) {
  const targets = args.length ? args : [DEFAULT_DIR];
  const files = [];
  for (const t of targets) {
    if (!fs.existsSync(t)) { console.error(`! ${t}: not found`); continue; }
    if (fs.statSync(t).isDirectory()) {
      fs.readdirSync(t).filter((f) => f.endsWith('.json') && f !== 'catalog.json').sort().forEach((f) => files.push(path.join(t, f)));
    } else files.push(t);
  }
  return files;
}

function main() {
  const files = collectFiles(process.argv.slice(2));
  if (!files.length) { console.error('no .json cards found'); process.exit(2); }

  const parsed = files.map((f) => {
    try { return { f, data: JSON.parse(fs.readFileSync(f, 'utf8')) }; }
    catch (err) { return { f, parseError: err.message }; }
  });
  const allIds = new Set(parsed.map((p) => p.data && p.data.id).filter(isStr));
  const idCount = {};
  parsed.forEach((p) => { if (p.data && isStr(p.data.id)) idCount[p.data.id] = (idCount[p.data.id] || 0) + 1; });

  let fatal = 0, ok = 0;
  for (const p of parsed) {
    const name = path.basename(p.f);
    if (p.parseError) { fatal++; console.log(`✗ ${name}\n    LOADER  invalid JSON: ${p.parseError}`); continue; }
    const stem = name.replace(/\.json$/, '');
    const le = loaderErrors(p.data);
    const se = schemaErrors(p.data, stem);
    const wa = warnings(p.data, allIds);
    if (isStr(p.data.id) && idCount[p.data.id] > 1) se.push(`duplicate id "${p.data.id}" across ${idCount[p.data.id]} files`);
    const bad = le.length || se.length;
    if (bad) fatal++; else ok++;
    console.log(`${bad ? '✗' : '✓'} ${name}${bad ? '' : wa.length ? `  (${wa.length} warning${wa.length > 1 ? 's' : ''})` : ''}`);
    le.forEach((m) => console.log(`    LOADER  ${m}`));
    se.forEach((m) => console.log(`    SCHEMA  ${m}`));
    wa.forEach((m) => console.log(`    warn    ${m}`));
  }
  console.log(`\n${ok} ok · ${fatal} failing · ${files.length} files`);
  if (fatal) console.log('LOADER failures are dropped by the app at load time; SCHEMA failures ship but render wrong.');
  process.exit(fatal ? 1 : 0);
}

main();
