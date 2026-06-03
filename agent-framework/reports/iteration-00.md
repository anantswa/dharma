# Iteration 00 — Baseline grade (current `main`)

**Consolidated by Claude 4.8** from the Gemini 3.1 Pro + Grok 4.2 panel (raw scorecards in
`reports/iteration-00/`). This grades the build *as inherited* — no changes yet.

## Verdict
- **Gate: FAILED** — a Supabase **service-role key** is hardcoded in client source
  (`src/services/supabase.ts:15`, value begins `sb_secret_…`). This ships a full-database
  write/bypass-RLS credential inside the app binary. Per rubric, score is **capped at 49/100**.
- **Consolidated score (pre-gate cap): ~53/100** → "iterate" band even before the gate.
- The bones are good (faith filtering, offline cache-first, a real multi-step lesson flow).
  The *experience* layer the panel cares most about (haptics, streaks, the moat assets, native
  media, contextual monetization, share) is mostly absent or placeholder.

## Consolidated scorecard

| # | Dimension | Wt | Gem | Grok | **Claude (final)** | Pts | Note |
|---|---|--:|:--:|:--:|:--:|--:|---|
| 1 | Darshan / Daily Ritual Loop | 20 | 3 | 3 | **3** | 12.0 | Carousel uses core `FlatList`+`Image` (not `expo-image`/Reanimated for the swipe); aarti uses Reanimated but no haptics/particles/parallax/streak. |
| 2 | Faith Personalization Depth | 16 | 4 | 4 | **3** | 9.6 | Filtering works across screens, but the *bar* — instant 3 distinct visual+voice identities — is absent. Palette/deity-set/voice don't transform. |
| 3 | Sensory Fidelity | 12 | 3 | 3 | **3** | 7.2 | Good bg/fg audio lifecycle; **zero `expo-haptics`**; no crossfade/preload. |
| 4 | Asset Moat Utilization | 12 | 3 | 2 | **2** | 4.8 | Placeholder WAVs + `react-logo` assets; core music/books **link out** to Spotify/Play. Suno/ElevenLabs/GN/film not wired. |
| 5 | Habit & Retention | 10 | 2 | 3 | **2** | 4.0 | Notifications + lesson progress exist; no streak, no "Today's Practice." |
| 6 | Offline-First & Tech | 8 | 4 | 2 | **3** | 4.8 | Cache-first + bundled fallback is solid; undercut by typecheck errors, AsyncStorage for large data, and the leaked key. |
| 7 | Learning Quality | 8 | 4 | 4 | **4** | 6.4 | `LessonFlowScreen` is genuinely good (read→meaning→audio→reflect); but only **Chalisa** has depth and its audio is placeholder. |
| 8 | Monetization Taste & Flow | 8 | 3 | 2 | **2** | 3.2 | Basic `react-native-iap` in a screen literally named `IapTestScreen`; no contextual paywall, no RevenueCat, external links. |
| 9 | Authenticity, Safety & Trust | 4 | 1 | 1 | **1** | 0.8 | Leaked service key; placeholder audio. Verses themselves are attributed. |
| 10 | Delight & Shareability | 2 | 0 | 2 | **1** | 0.4 | Nice aarti drag micro-moment; **no share** anywhere. |
| | **Total (pre-gate)** | 100 | | | | **53.2** | |
| | **Final (gate cap)** | | | | | **49** | gate failed |

## Top improvements for Iteration 01 (the teacher's notes — ranked)
1. **[GATE] Kill the leaked secret.** Replace the service-role key in `supabase.ts` with the
   **anon/public** key, confirm RLS is read-only on `wisdom`/`festivals`/`images`, and purge the
   key from git history. *Blocks everything; needs the anon key from the Supabase dashboard.*
2. **Darshan loop → "living temple."** Add `expo-haptics` (swipe snap, aarti, shankh bell),
   a particle/glow on aarti lift, real parallax on the temple frame, and a **daily streak +
   "Prasad" reveal** surfaced on Home. (Dim 1, 3, 5 — highest combined weight.)
3. **Wire the moat.** Swap placeholder WAVs/`react-logo` for production Suno tracks + ElevenLabs
   narration + graphic-novel panels; make the music player + GN reader **native**, stop linking
   out to Spotify/Play for the core experience. (Dim 4.)
4. **Faith identity, not just filtering.** Make `primaryTradition` drive palette, deity/icon set,
   voice, and notification source so Hindu/Buddhist/Christian feel like 3 distinct sanctuaries.
   (Dim 2.)
5. **Monetization with taste.** Move off the test screen to contextual inline paywalls
   (locked narration/GN chapters) + layered SKUs from `PRODUCT_SPEC.md`; evaluate RevenueCat.
   (Dim 8.)
6. **Shareable sacred cards.** One-tap verse+art+audio card export (dark-mode native). (Dim 10.)

## Panel agreement notes
- Both models independently flagged the leaked key as priority #1 and the Darshan loop as the
  highest-leverage experience gap. Largest divergence: Gemini rated offline/tech 4 vs Grok 2
  (Grok penalized harder for the typecheck failure + key) — I split it at 3.
