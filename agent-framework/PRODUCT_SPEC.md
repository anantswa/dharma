# Dharma — Product Specification (v1)

> Consolidated by **Claude 4.8** from a three-model panel — **Gemini 3.1 Pro**, **Grok 4.2**,
> and **Claude 4.8** (raw transcripts in `consult/`). Where the panel converged I kept the
> shared position; where it diverged I made the call and noted why.

## 1. One-line definition
Dharma is a **daily sacred companion** that turns DharmaWeave's proprietary asset library
(original music, painterly deity art, graphic novels, films, narrated scripture) into a
**living temple in your pocket** — one that instantly customizes to the user's faith and gives
them a small, beautiful, repeatable ritual that brightens their day.

It is **not** a multi-faith encyclopedia. Both Gemini and Grok independently flagged the
"Wikipedia trap" (optimizing for content volume) as the #1 way apps in this space die.

## 2. Faiths (scope decision — NEEDS ANANT CONFIRM)
Founder intent: **three faiths — Hindu, Buddhist, Christian.** The codebase currently ships
seven (`Hindu, Sikh, Buddhist, Jain, Zen, Christian, Sufi`). Recommendation: **center the
product on the three**, keep the other four's data available but de-emphasized (or behind a
"more traditions" affordance) rather than deleting work. *Confirm before we narrow.*

The hard requirement both models stressed: **faith centering**. Once a user picks a path,
~90% of what they see — home deity/icon set, calendar, library, learn modules, color/voice
palette, notifications — must be **that tradition**, with zero accidental cross-faith bleed
(a Christian user must never land on Hanuman; a Hindu user must never get a daily Bible push).

## 3. The heart: the Darshan / Daily Ritual Loop
The single most important thing to get right (unanimous panel verdict). The home screen must
feel like a **living temple**, not a carousel:
- Full-screen, 60fps swipe between deities/sacred figures (Reanimated + Gesture Handler).
- Layered temple frame with depth/parallax; time-of-day (and ideally moon-phase) adaptive.
- Interactive **aarti plate** with **haptics + particle + audio sync**; shankh/Om loop.
- Persistent floating music player (original Suno tracks), background playback.
- A daily **"Prasad"** reveal — today's curated teaching + art + audio snippet — plus a
  **streak** for consecutive darshans. Variable daily reward = the retention engine.

## 4. Pillars (the tabs, in priority order)
1. **Temple (Home)** — the darshan loop above.
2. **Learn** — verse-by-verse modules at "Hanuman Chalisa depth": text → chant → meaning →
   art → retention check → "carry it today." Need ≥2 modules at this quality per faith.
3. **Wisdom** — *curated daily push first*, searchable library second. Inline premium narration.
4. **Calendar / Panchang** — faith-specific festivals & observances with significance + ritual;
   the Hindu path gets the Panchang (tithi/nakshatra) Anant prototyped.
5. **Store / Offerings** — see revenue stack; contextual, not buried.

## 5. Revenue stack (consolidated & ranked)
Both models said: **do not stop at a one-time unlock** (caps LTV, doesn't fund ongoing asset
generation). Build a layered stack:

| Rank | Product | Price | Why it fits | Effort |
|---|---|---|---|---|
| 1 | **Dharma+ subscription** | $4.99–6.99/mo or $39–49/yr | Background audio, full ElevenLabs narration of all teachings, native graphic-novel + film library, all-traditions. Directly monetizes the moat; recurring. | Low |
| 2 | **"Temple Maintenance" lifetime** | $39 intro → $49 | Feels like donating to a real temple; high one-shot conversion from engaged users. Keep as an option, not the only SKU. | Low |
| 3 | **Virtual Puja consumables** | $0.99–9.99 | "Light a lamp / offer flowers / sponsor a shankh" — spectacular visual payoff using our painterly art + particles. Devotional whales are real. Route ~30% to transparent real charity. | Med |
| 4 | **Sankalp / dedications** | variable, platform fee 15–20% | Dedicate a mantra/puja for a specific intention (health, exams, peace). High margin, high meaning. | Med |
| 5 | **Generative print-on-demand** | $50–150 AOV | "Buy this as a canvas" next to deity art → Printify/Printful. Zero inventory; turns digital art moat into physical revenue. (Ties to existing Gelato/Etsy pipeline.) | Med |
| 6 | **Family / Ashram plan** | $79/yr, up to 5 | Diaspora buys for parents/grandparents; purchaser ≠ end-user. | Med |
| 7 | **Serialized GN / film unlocks** | $4.99–9.99 | Sell complete illustrated Chalisa / long-form films; YouTube becomes the funnel. | Low |

**Avoid:** ads, generic merch link-outs, anything that breaks the sacred feel. Keep payments
native (StoreKit/Play Billing via RevenueCat or expo IAP) — external Stripe checkout violates
store rules.

## 6. Non-negotiables (Claude-added, from DharmaWeave brand canon)
- **Scriptural authenticity**: verses correct, correctly attributed, transliteration accurate.
  Getting scripture wrong is brand-fatal. Canonical text first; never paraphrase silently.
- **Decency & safety**: no horror/nightmare imagery; deities depicted with dignity (e.g.
  goddesses fully clothed). Light/uplifting register — no dark themes as primary content.
- **Trust**: no leaked secrets in the client; privacy policy honest; no dark-pattern paywalls.

## 7. Definition of "winning"
- Day-1→Day-2 retention ≥ 70%; weekly active ≥ 35%; module completion ≥ 60%.
- Users open the app *to feel calm*, not out of guilt.
- Every screen pulls from the asset moat; nothing links the user out to YouTube/Spotify to
  consume the core experience.
