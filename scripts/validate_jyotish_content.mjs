// Content invariants: every answer index valid, trials winnable, personalization templates known.
import { readFileSync } from 'fs';
const src = (f) => readFileSync(`src/data/jyotish/${f}`, 'utf8');
// crude TS->data: eval the object literal after stripping types/imports
const load = (f, name) => {
  const s = src(f).replace(/import[^;]+;/g, '').replace(/export const \w+: Unit =/, 'globalThis.__U =');
  eval(s); return globalThis.__U;
};
const KNOWN_TEMPLATES = new Set(['moon-sign','moon-nakshatra','lagna','first-dasha','graha-spread']);
let fails = 0;
for (const f of ['unit1.ts','unit2.ts']) {
  const u = load(f);
  let quiz=0, wheel=0, story=0, personal=0;
  u.cards.forEach((c, i) => {
    if (c.kind==='quiz'){ quiz++; if(c.answer<0||c.answer>=c.choices.length){console.log(`FAIL ${f} card${i}: answer OOB`);fails++;} if(!c.why){console.log(`FAIL ${f} card${i}: no why`);fails++;} }
    if (c.kind==='wheel'){ wheel++; if(c.answerSign<0||c.answerSign>11){console.log(`FAIL ${f} card${i}: sign OOB`);fails++;} }
    if (c.kind==='story'){ story++; if(c.text.length>620){console.log(`WARN ${f} card${i}: long story (${c.text.length})`);} }
    if (c.kind==='personal'){ personal++; if(!KNOWN_TEMPLATES.has(c.template)){console.log(`FAIL ${f} card${i}: unknown template ${c.template}`);fails++;} }
  });
  u.trial.items.forEach((q,i)=>{ if(q.answer<0||q.answer>=q.choices.length){console.log(`FAIL ${f} trial${i}: answer OOB`);fails++;} });
  if (u.trial.passCount > u.trial.items.length){console.log(`FAIL ${f}: unwinnable trial`);fails++;}
  console.log(`${f}: ${u.cards.length} cards (${story} story, ${quiz} quiz, ${wheel} wheel, ${personal} personal), trial ${u.trial.items.length}q pass ${u.trial.passCount} in ${u.trial.seconds}s`);
}
console.log(fails ? `${fails} FAILURES` : 'ALL CONTENT INVARIANTS PASS');
