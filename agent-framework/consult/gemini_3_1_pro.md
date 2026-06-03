### PART A — Product Parameters & Ideas

**The harsh truth:** Nobody wakes up wanting to read a multi-faith database. Spiritual apps fail because they build encyclopedias instead of sanctuaries. Your moat is your massive proprietary asset library (audio, art, video). The app's sole purpose is to package those assets into a frictionless, daily dopamine-laced ritual. 

#### 1. The 8 Optimization Parameters
1. **Time-to-Altar (TTA) < 1.5s:** 
   * *Why:* Spiritual apps are opened in moments of stress, waking up, or commuting. If they see a loading spinner, the spell is broken.
   * *What "Great" Looks Like:* Zero network blocking on launch. The instant the app opens, the audio loop starts and the Darshan is visible. 
2. **60fps Sacred Immersion (Fluidity):**
   * *Why:* A stuttering deity carousel feels profane. Jerky animations destroy the suspension of disbelief.
   * *What "Great" Looks Like:* 100% JS-thread bypass for animations. Strict use of `react-native-reanimated` and `expo-image` with aggressive memory caching for the layered PNGs.
3. **Multisensory Feedback Loops:**
   * *Why:* Tapping an "aarti plate" on a flat screen is boring unless it physically and audibly reacts.
   * *What "Great" Looks Like:* Heavy use of `expo-haptics`. A soft vibration on swiping deities, a heavy thud when ringing the bell, perfectly synced with the shankh/Om audio loop. 
4. **Strict State Segregation (Faith-Native Routing):**
   * *Why:* A Christian user does not want to see Hanuman on the home screen by accident. A Hindu user doesn't want Bible verses in their daily push. 
   * *What "Great" Looks Like:* Zustand state is strictly partitioned. `user.faith` dictates the entire UI theme, asset fetching, and calendar rendering instantly. 
5. **Asset Density & Native Playback:**
   * *Why:* Linking out to Spotify or YouTube destroys your session time and hands your moat to aggregators.
   * *What "Great" Looks Like:* Suno-composed music plays in a custom, floating `expo-av` player that persists across tabs. Graphic novels are read natively in a custom pagination component, not a webview.
6. **The "Daily Prasad" (Habit Hook):**
   * *Why:* Retention requires a variable reward.
   * *What "Great" Looks Like:* A daily "reveal" mechanic. A specific teaching, a piece of deity art, and an audio snippet packaged as today's blessing. Streaks for consecutive daily Darshans.
7. **Offline-First Resilience:**
   * *Why:* Temples have thick stone walls and no cell service. Commutes have dead zones.
   * *What "Great" Looks Like:* The 800+ festivals and 600+ teachings are bundled in SQLite/MMKV. Supabase is strictly for background sync, never for blocking reads.
8. **Monetization Proximity:**
   * *Why:* Hiding the store in a 5th tab starves the business. 
   * *What "Great" Looks Like:* Contextual upsells. Reading a free Hanuman Chalisa verse? The audio narration by ElevenLabs is locked behind a premium icon right inline.

#### 2. Revenue Model (Ranked by Expected $ & Ease)
Kill the one-time premium unlock. The LTV is capped, and it doesn't fund ongoing AI asset generation. 

1. **The "Dharma+" Subscription ($4.99/mo or $39.99/yr) — *High $, Low Effort***
   * *Mechanic:* Unlocks background audio play (listen to mantras while phone is locked), premium ElevenLabs narration for all 600 teachings, and full access to the graphic novel library natively.
   * *Why:* Leverages your existing audio/art moat perfectly. Standard SaaS metrics apply.
2. **"Digital Sankalp" Consumables ($0.99 - $4.99) — *High $, Medium Effort***
   * *Mechanic:* Users buy premium digital offerings for the Darshan (e.g., a rare animated lotus garland, a special 3D diya) that last for 24 hours. 
   * *Why:* Whales exist in religion just like in gaming. People spend heavily on real-world temple offerings; digital micro-transactions scratch the same devotional itch.
3. **Generative Print-on-Demand (E-commerce) — *Medium $, Medium Effort***
   * *Mechanic:* You have thousands of pieces of original gpt-image-2 deity artwork. Add a "Buy Canvas" button next to every image. Route via API to Printify/Printful.
   * *Why:* Zero inventory. High AOV ($50-$150). Transforms your digital art moat into physical revenue.
4. **Family "Ashram" Plan ($9.99/mo) — *High $, High Effort***
   * *Mechanic:* Allow up to 4 accounts. 
   * *Why:* Younger, tech-savvy users will buy this to install on their parents' / grandparents' phones. The purchaser is not always the primary end-user.

#### 3. The Single Most Important Thing & Common Failure Mode
* **The Most Important Thing:** The **Darshan Loop**. The home screen swipeable deity experience must be flawless, beautiful, and emotionally resonant. If you nail the haptics, the audio cross-fading, and the visual depth of the temple frame, users will open the app just to feel calm.
* **The Most Common Failure:** **The "Wikipedia" Trap.** Founders get obsessed with database size (800 festivals! 600 teachings!). Users do not care. They want curation, not a search bar. If you don't actively push *one* relevant piece of content to them daily, your massive database is useless.

---

### PART B — Grading Rubric for Critic Agent

**Instructions for Critic Agent:** Review the React Native/Expo codebase and UI screenshots. Score the build out of 100 using the following weighted dimensions. 

#### 1. Performance & Memory: The Darshan Loop (Weight: 20%)
* **Measurement:** Inspect `TempleDarshan.tsx` and image/animation imports.
* **100 (Excellent):** Uses `expo-image` with explicit `cachePolicy="memory-disk"`. Animations strictly use `react-native-reanimated` (`useSharedValue`, `useAnimatedStyle`). Lists use `@shopify/flash-list`. Zero `react-native` core `Image` or `Animated` imports.
* **50 (Adequate):** Uses `expo-image` but misses caching. Uses basic `Animated` API causing JS thread drops.
* **0 (Poor):** Uses standard RN `ScrollView` and `Image`. No memory management for the 10 deity PNGs.

#### 2. Offline-First Architecture (Weight: 15%)
* **Measurement:** Inspect data fetching logic, Supabase client setup, and local storage.
* **100 (Excellent):** Uses `expo-sqlite` or `react-native-mmkv` for the 800 festivals/600 teachings. `AsyncStorage` is banned for large datasets. Supabase is used strictly in a background sync pattern (`onSnapshot` to local DB).
* **50 (Adequate):** Uses `AsyncStorage` for everything. It works, but parsing large JSON blocks blocks the JS thread on launch.
* **0 (Poor):** App makes blocking network requests to Supabase on launch. Fails to render if airplane mode is on.

#### 3. Faith-State Isolation & Routing (Weight: 15%)
* **Measurement:** Inspect Zustand store (`store.ts`) and conditional rendering logic.
* **100 (Excellent):** Zustand store has a clear `userFaith` slice. Selectors automatically filter the Wisdom Library and Calendar. UI themes (colors/fonts) are reactive to this state without requiring app reloads.
* **50 (Adequate):** State works, but logic is heavily nested in components (e.g., massive `if/else` blocks in the render function instead of selectors).
* **0 (Poor):** Faith state bleeds. Hindu users accidentally fetch Christian calendar data.

#### 4. Sensory Integration (Audio & Haptics) (Weight: 15%)
* **Measurement:** Inspect `expo-av` audio lifecycle and `expo-haptics` implementation.
* **100 (Excellent):** Audio instances are pre-loaded. Cross-fading is implemented between tracks. `expo-haptics` (`impactAsync`) is fired on swipe snaps, button presses, and interactive elements. Audio unmounts cleanly to prevent memory leaks.
* **50 (Adequate):** Audio plays but stutters on load. Haptics are missing or overused.
* **0 (Poor):** No haptic feedback. Audio playback blocks UI rendering or causes crashes on backgrounding.

#### 5. Moat Utilization (Native Media Playback) (Weight: 15%)
* **Measurement:** Inspect how music, graphic novels, and audiobooks are consumed.
* **100 (Excellent):** Custom native audio player with background playback capabilities (`expo-av` audio mode configured for background). Graphic novels use a custom RN swiper with pinch-to-zoom.
* **50 (Adequate):** Media is inside the app, but uses clunky webviews or standard un-styled players.
* **0 (Poor):** App uses `Linking.openURL` to kick users out to Spotify or YouTube.

#### 6. Sacred Aesthetic & UI Polish (Weight: 10%)
* **Measurement:** Inspect stylesheets, typography, and screenshots.
* **100 (Excellent):** Strict adherence to dark/gold palette. Playfair Display is loaded correctly and applied globally. Zero system-default blue buttons. Padding and margins are mathematically consistent (e.g., multiples of 8).
* **50 (Adequate):** Custom fonts work but flash system fonts on load (FOUT). Colors are inconsistent.
* **0 (Poor):** Looks like a generic Bootstrap/Material template. No spiritual/temple atmosphere.

#### 7. Monetization Scaffolding (Weight: 10%)
* **Measurement:** Inspect paywall components and IAP library integration.
* **100 (Excellent):** Uses `react-native-purchases` (RevenueCat) or `expo-in-app-purchases`. Paywalls are contextual (e.g., overlay on locked audio tracks) rather than isolated to a "Store" tab. 
* **50 (Adequate):** IAP is scaffolded but isolated entirely to a separate tab. No contextual upsells.
* **0 (Poor):** No actual native IAP code; just UI mockups or links to external Stripe checkouts (violates App Store guidelines).