# Consult brief — "Dharma" mobile app product + grading rubric

You are one of three expert advisors (the others are Gemini 3.1 Pro, Grok 4.2, and
Claude 4.8). Anant Swarup, founder of DharmaWeave, is finishing a spiritual mobile
app called **Dharma** and wants a shared product definition + a grading rubric that a
coding agent and a critic agent will use to iterate on the build.

## What already exists (React Native + Expo SDK 54, TypeScript, offline-first + Supabase)
- **Temple Darshan (Home):** full-screen swipeable deity carousel (10 deities), layered
  temple frame PNG, tap "aarti plate", shankh/Om audio loop, floating devotional music player.
- **Sacred Calendar:** 800+ festivals/observances across traditions; tap for significance/rituals.
- **Wisdom Library:** 600+ teachings (Gita, Guru Granth Sahib, Dhammapada, Bible, Sufi poets,
  Zen, Jain), filter by tradition, original + transliteration + English.
- **Learn:** interactive lesson modules (Hanuman Chalisa 43 verses w/ Hindi+translit+meaning+art;
  more modules scaffolded).
- **Store tab:** in-app purchase scaffold (premium lifetime unlock) + links to books on Google
  Play and chants on Spotify.
- **Daily wisdom notifications**, faith onboarding (pick primary tradition), dark/gold design
  (Playfair Display), Zustand state, AsyncStorage.
- Backend: Supabase (614 wisdom rows, 816 festivals, 904 images).

## DharmaWeave's existing asset library (this is the moat — the app should USE it)
- Original **devotional music / mantras** (Suno-composed, canonical Sanskrit/Hindi verses,
  also on Spotify/DistroKid as singles), narration voices (ElevenLabs).
- Thousands of pieces of original **deity artwork** (gpt-image-2, painterly cosmic devotional
  register) + **graphic novels** (e.g. Hanuman Chalisa Illustrated, Varaha) + **long-form films**
  and **reels** on YouTube.
- Deep scripture/wisdom database with transliteration + translation.

## Product intent (founder's words, paraphrased)
- Three faiths to start: **Hindu, Buddhist, Christian**. The app should **customize to the
  user's faith instantly on launch**.
- It must feel **native to the app format** (not a repackaged feed). Open the temple, swipe to
  see the gods. Learn the Gita / learn a practice. A Panchang/sacred-calendar.
- It should be **helpful, fun, enjoyable, and brighten the user's day**.
- It must **drive revenue** for DharmaWeave and **drive traction**.
- Surface **novel revenue / product ideas** ideally suited to the app format that the founder
  may not have thought of.

## YOUR TASK — answer BOTH parts, dense markdown, no fluff.

### PART A — Product parameters & ideas
1. The 6-10 **parameters/dimensions** a spiritual app like this should optimize for, to win on
   (a) revenue, (b) traction/retention, (c) genuine usefulness + delight, (d) faith-native feel.
   For each: why it matters and what "great" looks like in 2026.
2. **Revenue model**: concrete, app-native monetization ideas ranked by expected $ and ease.
   Include ideas beyond a one-time premium unlock (subscriptions, consumables, commerce,
   donations/sankalp, family plans, etc.). Tie them to the existing asset library where possible.
3. The **single most important thing** to get right, and the most common way apps in this space fail.

### PART B — Grading rubric
Propose a concrete rubric the critic agent will score each build against:
- 6-10 **weighted dimensions** (weights sum to 100).
- For each dimension: a 0-5 or 0-100 scale with explicit descriptors for excellent / adequate / poor,
  and **how to measure it** from the actual app build (what the critic should inspect).
- Keep it actionable for an automated critic reviewing a React Native codebase + screenshots.

Return PART A and PART B clearly separated.
