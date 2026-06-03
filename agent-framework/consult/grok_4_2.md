**PART A — Product Parameters & Ideas**

### 1. 8 Parameters/Dimensions to Optimize (2026 standards)

| Dimension | Category | Why It Matters | What "Great" Looks Like in 2026 |
|---------|----------|----------------|---------------------------------|
| **Emotional Uplift on Open** | Delight + Faith-native | First 8 seconds decide retention. Most spiritual apps feel like databases. | User feels *lighter* within 5s. Temple Darshan triggers immediate dopamine + peace. Music adapts to time of day/moon phase. 70%+ Day 1 → Day 2 retention. |
| **Faith Centering & Instant Relevance** | Traction + Faith-native | Users reject generic syncretism. Primary tradition must dominate 90% of experience. | Onboarding completes in <45s. Home screen, calendar, library, learn, notifications, color palette, and *voice* all transform instantly (Hindu temple vs Buddhist vihara vs Christian chapel). Zero "interfaith" dilution on primary path. |
| **Sensory Fidelity** | Delight + Moat leverage | Your original music, narration, and painterly art are the only true differentiator. | Full use of Suno tracks with shankh/aarti layers, ElevenLabs narration that *feels* sacred, Reanimated 60fps deity transitions with parallax temple frame. Haptic aarti plate. Offline-first audio caching. |
| **Habit Loop Strength** | Retention | Spiritual practice dies without rhythm. | Streak system + "Today's Practice" (3-7 min) that actually moves the needle on user energy/mood. Smart notifications (not spam) using calendar + moon phase + user history. 35%+ weekly active users. |
| **Progressive Mastery** | Usefulness | People want to *become* better, not just consume. | Hanuman Chalisa module is gold standard: verse → chant → meaning → art → quiz → "live with it today." Completion rate >60%. Clear skill trees per tradition. |
| **Offline Sanctity** | Usefulness + Retention | Temples don't require internet. 40%+ of Indian users have flaky data. | 95%+ of core experience works offline (cached darshan, 200+ teachings, calendar, downloaded music). Supabase sync is invisible. |
| **Revenue Without Violating Sacredness** | Revenue | Users will pay for transformation and beauty, not features. | Monetization feels like *seva* or *dakshina*, never commerce. Virtual offerings, exclusive original tracks, and "temple maintenance" (lifetime) all feel native. |
| **Shareable Sacred Moments** | Traction | Best growth is organic among believers. | One-tap beautiful cards (verse + original art + audio snippet) that look native to WhatsApp/Instagram. Reels export from graphic novels. |

### 2. Revenue Model (Ranked by Expected LTV × Probability)

**Ranked order (my conviction):**

1. **"Temple Maintenance" Lifetime Unlock ($49 one-time, $39 intro)** — Expected LTV contribution: highest. 18-25% conversion from engaged users. Feels like donating to a real temple. Unlocks all traditions, all original music, offline everything, removes any limits. **Best first monetization.**

2. **Monthly "Fresh Offerings" Subscription ($6.99/mo or $49/yr)** — Highest long-term revenue. Delivers 2 new original Suno mantras + 1 new graphic novel chapter + 1 exclusive film cut every month. Uses your moat directly. Churn target <6%/mo.

3. **Virtual Puja Consumables ("Light a Lamp", "Offer Flowers", "Sponsor a Shankh")** — $1.99–$9.99. Visual payoff in Temple Darshan is *spectacular* (your painterly assets + particle effects). 15-20% of users will drop $2-5 weekly. Tie 30% to real charity (transparent). Highest impulse revenue.

4. **Family Plan ($79/yr for 5 accounts)** — Massive for Indian diaspora. One grandfather pays for entire joint family.

5. **Serialized Graphic Novel & Film Unlocks** — Sell individual long-form films or complete illustrated Chalisa as $4.99–$9.99 premium experiences. Your YouTube content becomes the marketing funnel.

6. **"Sankalp" Donations** — High-margin, high-meaning. User dedicates a mantra or puja for a specific outcome (health, exams, peace). App takes 15-20% platform fee.

**Avoid:** Ads, generic merch links in-app. They destroy the sacred feel.

### 3. Single Most Important Thing + Most Common Failure Mode

**Most important thing to get right: The Temple Darshan must feel like a *living temple*, not a carousel.**

It is the heart. Everything else is secondary. If users don't linger, swipe, perform aarti, and feel emotionally moved every single day, the rest of the app is irrelevant. This is your only real moat against generic wisdom apps.

**Most common way apps in this space fail:** They become *respectable content libraries* instead of *transformative daily companions*. They optimize for "amount of content" instead of *emotional frequency*. The result is 9% Day 30 retention and users who feel mildly guilty when they see the app icon.

### PART B — Grading Rubric (for Critic Agent)

**Total weight: 100.** Critic scores each build 0-5 per dimension from **codebase inspection + screenshots + simulated user flows**. Automated where possible.

| Weight | Dimension | 5 (Exemplary) | 3 (Adequate) | 1 (Poor) | Measurement Method |
|-------|----------|---------------|--------------|---------|-------------------|
| **22** | **Temple Darshan Experience** | Full-screen immersive, buttery 60fps swipe (Reanimated + Gesture Handler), layered temple PNG with parallax, aarti plate with haptic + particle + audio sync, floating player, time-adaptive music. Feels sacred. | Basic swipeable carousel with some polish | Static image or janky list | Inspect `TempleScreen.tsx` (or equivalent). Check Reanimated 3 usage, `expo-av` audio layering, haptic feedback, frame rate on low-end device sim. Review screenshots for visual hierarchy. |
| **18** | **Faith Personalization Depth** | Instant theme switch on launch (3 distinct visual + audio identities). All core screens (Temple, Calendar, Library, Learn) transform. Correct deities/icons per faith. | Only colors change | Generic experience with "Hindu bias" leaking | Review onboarding flow + Zustand store for `primaryTradition`. Inspect conditional rendering in 4 major screens. Check asset mapping. |
| **15** | **Asset Moat Utilization** | Heavy use of original Suno tracks, ElevenLabs voices, painterly art, graphic novel panels throughout. Not placeholder content. | Some original assets used | Mostly stock or YouTube embeds | Search codebase for specific asset IDs from Supabase. Count unique original tracks/art used. Review Learn modules for graphic novel integration. |
| **12** | **Habit & Retention Systems** | Intelligent daily practice, streaks with meaning, smart notifications (not volume), progress visible everywhere. | Basic streak + daily quote | No systems or annoying notifications | Inspect notification logic, streak engine, "Today's Practice" screen. Review local storage schema and Supabase user progress tables. |
| **10** | **Learning Experience Quality** | Hanuman Chalisa-level depth in at least 2 modules. Verse-by-verse with chant, meaning, art, retention quiz. Beautiful. | Basic reading modules | Just text dumps | Open Learn modules. Check for synchronized audio + text + art. Test quiz flow. |
| **10** | **Technical Excellence & Offline** | 95%+ offline, buttery animations, clean TypeScript, proper Supabase offline pattern (with Zustand + AsyncStorage hydration), no jank. | Mostly works offline | Frequent loading states, poor types, online-only features | Run app with network disconnected. Review Supabase queries, cache strategy, Reanimated usage, TypeScript strictness. |
| **8** | **Monetization Taste & Flow** | Lifetime + consumables feel like sacred exchange. Beautiful paywalls using original art. No dark patterns. | Basic IAP screen | Aggressive or ugly paywalls | Inspect Store tab and all paywall triggers. Review copy and visual treatment. |
| **5** | **Delight & Shareability** | Multiple "holy shit" micro-moments. One-tap sacred cards look native to social. | Some nice touches | Corporate or boring | Review share flows, micro-interactions, animation variety. Test exported cards in dark mode. |

**Scoring Rule:** 
- **≥90** = Ship to users
- **75-89** = Fix critical issues then ship
- **<75** = Do not ship

This rubric is deliberately weighted toward the *experience* (Temple + Faith + Sensory) because that is what determines whether this becomes a meaningful company or another forgotten spiritual app.