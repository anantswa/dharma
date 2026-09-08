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
 *             importance/gap 1–5, words[] fields, audio.sung string|null,
 *             quiz[] with optional imageUrl). The app tolerates most of these,
 *             but a wrong one renders as "undefined".
 *   WARN    — content-quality nudges (§8 bang line, sayItLike diacritics,
 *             v2 rules: art on every card, per-word clips, several visual
 *             questions, a sung track; v1 leftovers — practice / spoken
 *             tracks / t0,t1 — are flagged as ignored).
 *
 * v2 contract (2026-09-08): `practice` REMOVED (never rendered — hard stop on
 * prescriptive language); `audio = { sung: string | null, voice? }` — ONE
 * track; `words[i].audioUrl` per-word clip (t0/t1 gone); `quiz[i].imageUrl`;
 * `artPrompt` content-side only.
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
const RANK = [1, 2, 3, 4, 5];
const V1_AUDIO = ['spokenSlow', 'spokenNatural', 'master'];

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
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
    // the loader reads an absent key as null (player hidden) — anything else must be a URL string
    req('audio.sung', l.audio.sung == null || isStr(l.audio.sung), 'non-empty string or null required');
  }
  req('source', isObj(l.source), 'object required');
  req('significance', isObj(l.significance), 'object required');
  return e;
}

// ── SCHEMA tier: the full MantraLesson shape from types.ts ───────────────────
function schemaErrors(l, fileStem) {
  const e = [];
  if (!isObj(l)) return e;
  const oneOf = (k, v, list) => { if (v !== undefined && !list.includes(v)) e.push(`${k}: "${v}" not one of ${JSON.stringify(list)}`); };
  const optStr = (k, v) => { if (v !== undefined && typeof v !== 'string') e.push(`${k}: must be a string when present`); };

  // local files may carry an "NN_" teaching-order prefix; the producer uploads as lessons/<id>.json
  const stemId = fileStem ? fileStem.replace(/^\d+_/, "") : fileStem;
  if (isStr(l.id) && stemId && l.id !== stemId) e.push(`id "${l.id}" does not match file name "${fileStem}.json" (loader fetches lessons/<id>.json)`);
  oneOf('class', l.class, CLASSES);
  oneOf('tradition', l.tradition, TRADITIONS);
  oneOf('shelf', l.shelf, SHELVES);
  optStr('deityId', l.deityId);
  if (!RANK.includes(l.importance)) e.push(`importance: must be 1–5 (got ${JSON.stringify(l.importance)})`);
  if (!RANK.includes(l.gap)) e.push(`gap: must be 1–5 (got ${JSON.stringify(l.gap)})`);
  optStr('artUrl', l.artUrl);
  if (isStr(l.artUrl) && !/^https?:\/\//.test(l.artUrl)) e.push(`artUrl: must be an absolute http(s) URL — got "${l.artUrl}"`);
  optStr('artPrompt', l.artPrompt);

  if (Array.isArray(l.words)) {
    l.words.forEach((w, i) => {
      const p = `words[${i}]`;
      if (!isObj(w)) { e.push(`${p}: must be an object`); return; }
      for (const k of ['deva', 'iast', 'glossEn', 'glossHi']) if (!isStr(w[k])) e.push(`${p}.${k}: non-empty string required`);
      for (const k of ['root', 'grammar', 'audioUrl']) optStr(`${p}.${k}`, w[k]);
      if (isStr(w.audioUrl) && !/^https?:\/\//.test(w.audioUrl)) e.push(`${p}.audioUrl: must be an absolute http(s) URL (streamCache) — got "${w.audioUrl}"`);
      if (w.alsoIn !== undefined && !(Array.isArray(w.alsoIn) && w.alsoIn.every(isStr))) e.push(`${p}.alsoIn: must be an array of lesson ids`);
    });
  }

  if (isObj(l.audio)) {
    if (!('sung' in l.audio)) e.push('audio.sung: key required — a URL string, or null when the card has no sung track (player hidden)');
    else if (l.audio.sung !== null && !isStr(l.audio.sung)) e.push(`audio.sung: must be a non-empty string or null (got ${JSON.stringify(l.audio.sung)})`);
    if (isStr(l.audio.sung) && !/^https?:\/\//.test(l.audio.sung)) e.push(`audio.sung: must be an absolute http(s) URL (streamCache) — got "${l.audio.sung}"`);
    optStr('audio.voice', l.audio.voice);
    optStr('audio.loopKey', l.audio.loopKey);
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
  if (l.quiz !== undefined) {
    if (!Array.isArray(l.quiz)) e.push('quiz: must be an array when present');
    else l.quiz.forEach((q, i) => {
      const p = `quiz[${i}]`;
      if (!isObj(q)) { e.push(`${p}: must be an object`); return; }
      if (!isStr(q.prompt)) e.push(`${p}.prompt: non-empty string required`);
      optStr(`${p}.imageUrl`, q.imageUrl);
      if (isStr(q.imageUrl) && !/^https?:\/\//.test(q.imageUrl)) e.push(`${p}.imageUrl: must be an absolute http(s) URL — got "${q.imageUrl}"`);
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
    if (l.words.length === 0) w.push('words[] is empty — the word screen shows a placeholder and recall degrades');
    const withT = l.words.filter((x) => isObj(x) && (x.t0 !== undefined || x.t1 !== undefined)).length;
    if (withT) w.push(`${withT}/${l.words.length} words still carry t0/t1 — v1 alignment offsets, ignored (v2 = per-word clips)`);
    const noClip = l.words.filter((x) => isObj(x) && !isStr(x.audioUrl)).length;
    if (noClip) w.push(`${noClip}/${l.words.length} words have no audioUrl — tapping them is silent (v2 rule 2: per-word clips)`);
    l.words.forEach((x, i) => {
      if (isObj(x) && Array.isArray(x.alsoIn)) x.alsoIn.forEach((id) => { if (!allIds.has(id)) w.push(`words[${i}].alsoIn "${id}" is not among the cards being validated (sheet silently hides it)`); });
    });
  }
  // v2 rule 3 — an image for everything
  if (!isStr(l.artUrl) && !isStr(l.deityId)) w.push('no artUrl and no deityId — the card has NO image (v2 rule 3: an image for everything)');
  // v2 rule 2 — one sung track
  if (isObj(l.audio)) {
    if (l.audio.sung == null) w.push('audio.sung is null/absent — the player is hidden on this card (v2 rule 2: every card should carry its sung track)');
    const v1 = V1_AUDIO.filter((k) => l.audio[k] !== undefined);
    if (v1.length) w.push(`audio.${v1.join(', audio.')} — v1 spoken/master fields, ignored by the app (only audio.sung plays)`);
  }
  // v2 rule 5 — HARD STOP on prescriptive practice language
  if (l.practice !== undefined) w.push('practice block present — REMOVED in v2 (hard stop: no who/when/how/count language); the app never renders it, delete it from the card');
  // v2 rule 6 — visual gamification, several questions per card
  if (!Array.isArray(l.quiz) || l.quiz.length === 0) w.push('no quiz[] — recall falls back to the generic meaning-match (v2 rule 6: several visual questions per card)');
  else {
    if (l.quiz.length < 3) w.push(`quiz has ${l.quiz.length} item(s) — v2 rule 6 asks for several questions per card`);
    if (!l.quiz.some((q) => isObj(q) && isStr(q.imageUrl))) w.push('no quiz item carries imageUrl — recall is text-only on this card (v2 rule 6: image multiple-choice)');
    l.quiz.forEach((q, i) => { if (isObj(q) && Array.isArray(q.options) && q.options.length !== 4) w.push(`quiz[${i}] has ${q.options.length} options — the ImageQuiz grid is built for 4`); });
  }
  if (l.class === 'bija' && !l.deityId) w.push('bīja card without deityId — SeedEar/SeedMatch fall back to titleHi, no deity art');
  if (l.class === 'vedic' && isObj(l.source) && l.source.confidence !== 'located') w.push(`vedic card with confidence "${l.source.confidence}" — expected "located"`);
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
