# Dharma — Differentiation Thesis & v1 Wedge

> Consolidated by **Claude 4.8** from a Gemini 3.1 Pro + Grok 4.2 panel + web research
> (raw: `panel_gemini.md`, `panel_grok.md`; sources cited inline). The bet Anant chose:
> **scripture mastery engine + generative living catalog**, two faiths (Hindu + Buddhist).

## 1. The one-liner
**Dharma is Tarteel for the Gita — the app that makes the Bhagavad Gita and Hanuman Chalisa
*yours, by heart*, with an ever-growing generative temple of art, meaning, and sound.**
Externally: *"Duolingo for scripture."*

## 2. Why this is the bet (the evidence)
- **The model is proven — just not here.** *Tarteel* (AI Quran memorization, voice recognition,
  word-level mistake detection) has **15M+ users across 150+ countries** on a freemium model.
  Mastery-of-scripture-as-a-product *works at scale*. **No equivalent exists for the Gita/Chalisa.**
- **The Hindu app shelf is content, not mastery.** Every Gita app (Srimad Gita, ISKCON,
  BhagavadGita.com, SGS) is a *reader/reference + AI chat*. None is a gamified recitation-mastery
  engine. Whitespace is wide open and on-brand for DharmaWeave.
- **Faith apps are real businesses.** Hallow: 10M+ downloads, $105M+ raised, #1 on the App Store,
  $69.99/yr — but **pure passive consumption** (no mastery, no progression). Calm/Headspace plateau
  because *there's nothing to get better at.*
- **Devotees already want this.** "Memorize the Gita in 10 months" courses exist and sell; Hindus
  chant the Chalisa 11×/108× without understanding it. The demand is proven; the *product* is missing.
- **Duolingo proves the engine.** Streaks are "the single most effective retention lever";
  55% monthly DAU retention; 32M users on 7+ day streaks. SRS + streak is one system. We steal the
  mechanics, drop the childish tone and the punishing "hearts."

## 3. The moat (what's actually defensible)
1. **The SRS memory graph.** After ~45 days of spaced-repetition data mapped to a user's forgetting
   curve for *their* Gita, switching cost is near-total. This compounds; a content app's doesn't.
2. **The generative pipeline (not the models).** gpt-image-2 art + ElevenLabs/Kuber narration +
   Gemini/Claude scholarship + Suno music, tuned on 600+ *verified* scriptural entries, produces
   culturally-accurate art/insight/audio at ~zero marginal cost. The *pipeline + verified corpus*
   is the moat, not the (commodity) models.
3. **Two-faith depth + Śabda Brahman.** Exact recitation is doctrinally sacred in these traditions —
   the mastery framing is *native* here in a way it can't be for a "wellness for everyone" app.

## 4. The three ways this dies (and the guardrails)
1. **Generative slop / inauthenticity (the #1 killer).** AI art that looks plastic, or audio that
   mispronounces Sanskrit, reads as *disrespectful*. → **Guardrail:** human-curated, *pre-generated*
   assets from the verified corpus; locked painterly style; Devanagari (never IAST) for audio;
   nothing ships to a user unreviewed. Quality bar = 99.9%.
2. **Cognitive overload.** Memorizing Sanskrit is 10× harder than "hola." → **Guardrail:** karaoke
   highlighting, chunked verses, self-graded recall first (no hard ML gate), "infinite grace" (never
   punish a miss).
3. **Vitamin-not-painkiller churn + generative cost bleed.** → **Guardrails:** aggressive-but-gentle
   habit loop (streak/mala, smart reminders); and **never call generative APIs live for free users** —
   serve pre-generated, cached assets; rate-limit on-demand generation to paid. Watch *generative
   cost per MAU* like a hawk.

## 5. v1 wedge — the Smallest Lovable Product
Prove the bet on what we already have audio + text for: **the Hanuman Chalisa (42) and Gita
essentials**. The temple/darshan/calendar stay as the *home & retention surface*; the **learning
path becomes the spine.**

**Core daily loop (3–7 min):**
1. Open → **streak (Japa Mala, 108 beads)** + "Today's Sādhana" = 1 new verse + SRS reviews due.
2. **Listen** (Kuber) with **karaoke word-highlighting**.
3. **Read** Sanskrit → transliteration → meaning.
4. **Recall / recite** — v1: self-graded Leitner ("how well did you know it?") + drag-to-order the
   line; **fast-follow:** mic recitation scoring. *This is the magic moment.*
5. **Generative reward** — mastering a verse gifts a unique **Darshan image** for that exact verse
   (saveable, **one-tap WhatsApp share = viral loop**) + an "Explain Deeper" insight.
6. Close: 15-sec reflection.

**Build only these (6):** the Path UI, karaoke verse player, SRS (Leitner) engine, Japa-Mala streak,
mastery levels (Shishya → Upāsaka → Siddha) instead of XP, generative reward gallery ("Living Gita").

**Do NOT build in v1:** leagues/leaderboards, hearts/punishment, Panchang, social feed, music
composition, full Buddhist library, multi-language UI. (Buddhist/Dhammapada track = v2, once the
engine is proven on the two Hindu texts.)

## 6. Monetization
- **Free:** full mastery engine on the Chalisa + first Gita chapter; limited generations/day; standard voice.
- **Dharma+:** all texts, unlimited generations, premium voices, offline, voice analytics, ad-free.
- **Price:** **$4.99–7.99/mo · $39–59/yr (anchor — most convert here) · $199 lifetime.**
  Faith apps over-index on **lifetime** (faith = lifelong identity; expect 15–20% of payers).
- **Why it beats content:** content competes with free YouTube/Spotify (low willingness-to-pay).
  Mastery taps the **self-improvement + parental-heritage** budget ("I finally learned the Gita";
  "my kid will know our roots") — higher LTV, justifies CAC. Target 4–12% free→paid.

## 7. KPIs for the silent-launch (first 90 days, ~500–1,000 power users)
1. **D7 retention > 45%** — this *is* the bet.
2. **Verses mastered / active user ≥ 18** — proves real learning, not viewing.
3. **% sessions using a generative feature > 60%** — proves the catalog moat (and watch cost/MAU).
4. **7-day streak rate > 35%.**
5. **Lesson completion > 85%** — if lower, Sanskrit load/UX is too high.
> If D7 > 45% and generative usage > 60%, we have PMF. Everything else is noise.

## Sources
Tarteel (15M+ users): apps.apple.com / tarteel.ai · Hallow ($105M raised, $69.99/yr, #1 App Store):
contrary research, homebrew.co · Gita app landscape: srimadgita.com, bhagavadgita.com, ISKCON ·
Duolingo (streak = top retention lever, 55% MAU retention, 32M 7-day streaks): deconstructoroffun,
trypropel.ai.
