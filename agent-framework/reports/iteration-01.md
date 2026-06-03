# Iteration 01 — Faith identity + darshan delight

**Consolidated by Claude 4.8** from the Gemini 3.1 Pro + Grok 4.2 panel
(`reports/iteration-01/`). Verified live on Expo web (onboarding → Hindu darshan; the
"Today's Prasad" card now shows a 🔥 streak chip).

## What changed this iteration
- **Faith identity system** (`src/data/faiths.ts`): 3 primary faiths (Hindu / Buddhist /
  Christian) + 4 secondary, each with accent, greeting, blurb, deity set, tradition mapping.
  Architected so adding a faith later is a data entry, not a rewrite.
- **Onboarding** now leads with tappable faith **cards** (not a dropdown); selection re-themes
  the screen + CTA accent instantly.
- **Darshan**: deity carousel filtered to the chosen faith; pagination/shankh/prasad use the
  faith accent; **haptics** on swipe snap (`selectionAsync`), aarti lift/settle, shankh toggle.
- **Habit engine** (`src/store/streakStore.ts`): daily-darshan streak ("Prasad") recorded on
  Home mount, surfaced as a chip.
- **Share**: text share action added to WisdomDetail (the *visual* share card is still TODO).

## Score movement (pre-gate consolidated)

| Dimension | Wt | iter-00 | **iter-01** | Δ |
|---|--:|:--:|:--:|:--:|
| Darshan / Daily Ritual Loop | 20 | 3 | **4** | ▲ |
| Faith Personalization | 16 | 3 | **4** | ▲ |
| Sensory Fidelity | 12 | 3 | **4** | ▲ |
| Asset Moat | 12 | 2 | 2 | — |
| Habit & Retention | 10 | 2 | **4** | ▲▲ |
| Offline & Tech | 8 | 3 | **2** | ▼ (live Supabase 401 + baseline TS errors) |
| Learning Quality | 8 | 4 | 4 | — |
| Monetization | 8 | 2 | 2 | — |
| Authenticity & Trust | 4 | 1 | 1 | — (key still in source) |
| Delight & Share | 2 | 1 | 1 | — (text share only, not a card) |
| **Pre-gate total** | 100 | **53.2** | **65.2** | **+12** |
| **Gate-capped headline** | | 49 | 49 | gate held open |

## Gate status
Still **FAILED** — the `sb_secret_…` key remains in `supabase.ts`, per Anant's instruction to
leave keys as-is. Note discovered this iteration: **that key now returns `401 Invalid API key`**
(it was a service key, almost certainly killed in the 2026-05-25 account reset). So:
- It's a *dead* credential — low exposure risk, but
- **live Supabase data is broken** → the app runs on bundled fallback (~50 wisdom rows, not 614).
This is why "Offline & Tech" dropped: the panel correctly sees online data failing.

## Top improvements for Iteration 02 (ranked)
1. **Restore live data.** Provide a working Supabase **anon** key (or repoint the client) so the
   614 wisdom / 816 festivals / 904 images load again. Relocating it to `app.json` extra also
   clears the gate. *Biggest single product fix — the content moat is currently dark.*
2. **Visual share card.** `react-native-view-shot` + `expo-sharing` → render verse + faith art +
   wordmark as an image, shareable to WhatsApp/IG. (Dim 10, and a growth lever.)
3. **Reanimated swipe + parallax** on the darshan carousel (replace core FlatList) for true 60fps
   + depth on the temple frame. (Dim 1.)
4. **Christian + more Buddhist darshan art.** Bundle figures from the DharmaWeave asset library so
   the 3 primary faiths each have a real temple (Christian currently falls back to the full set).
5. **Monetization with taste.** Contextual paywall (locked narration / GN chapters) + layered
   SKUs; move off `IapTestScreen`. (Dim 8.)
6. **Clear baseline TS errors** (expo-router leftover, `Image pointerEvents`, `react-native-iap`
   types, lesson `hindi`, settings `section`) to stop them dragging Offline/Tech.
