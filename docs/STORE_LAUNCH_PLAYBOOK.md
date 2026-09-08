# Store Launch Playbook — everything learned shipping Dharma

> Written 2026-08-05, after taking `com.taraventures.dharma` (Expo SDK 54 / RN 0.81)
> from zero to live on both stores plus a full marketing funnel. Every item below
> was learned by hitting it, not from docs. Reuse for the next app; don't rediscover.
>
> Working references in this repo and Agentic-dharmaweave/scripts are named inline.

---

## 1. Accounts, credentials, auth

| Thing | State | Notes |
|---|---|---|
| Apple Developer / ASC | TARA VENTURES PTE. LTD., team `614cfe80-272d-48d3-b61a-87b4b96adc14` | One org account serves every app |
| ASC API key | `AuthKey_TQAZ5JQ2LT.p8` in `projects/dharma/credentials/`, key id `TQAZ5JQ2LT` | JWT ES256, 20-min expiry, `aud: appstoreconnect-v1`. Works for ALL apps on the account — reuse as-is |
| Google Play Console | Org account 8301934103704811013, login anant@tara-ventures.com | **No API service account exists.** Everything Play-side is manual until one is created (Setup → API access). Creating one unlocks: AAB upload, listing text+screenshots, install statistics |
| EAS | `eas build` for both platforms | Same account, per-app project |

**ASC JWT pattern** (copy from `Agentic-dharmaweave/scripts/dharma_ios_submit.py`):
```python
jwt.encode({"iss": ISSUER, "iat": now, "exp": now+1200, "aud": "appstoreconnect-v1"},
           open(P8).read(), algorithm="ES256", headers={"kid": KEY_ID, "typ": "JWT"})
```

## 2. Build & version discipline (Expo)

- **`runtimeVersion: {policy: "appVersion"}` means every OTA update must be
  published separately to EVERY live runtime** (1.0.3, 1.0.4, …) or users on
  older binaries are stranded on stale JS. Publish OTA per-runtime, always.
- **Never reuse a version number that ever went live.** Apple rejects the binary
  at ingest (ITMS-90186/90062). Bump patch version even for a resubmission.
- **Play media-permission policy:** RN image libraries pull in
  `READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO`, which Google now blocks for most apps.
  Fix in app.json: `"android": {"blockedPermissions": [...]}` — then VERIFY the
  final AAB manifest actually lost them before uploading:
  `bundletool dump manifest` or unzip + aapt.
- iOS binary submit + attach: `scripts/dharma_ios_submit.py`.

## 3. App Store Connect — the review/metadata machine

- **A `READY_FOR_SALE` version is immutable.** Any PATCH (description, keywords,
  screenshots, build attach) returns `409 STATE_ERROR`. To change anything, POST
  a new `appStoreVersions` record and do everything against that.
- Only **`promotionalText`** is editable while live — use it for "what's new"
  style messaging between releases.
- **Approved ≠ downloadable.** If `appAvailabilityV2` 404s, no territories were
  ever set and the app is invisible in every store. Set territories in the ASC
  UI (175 countries) — one-time, survives updates.
- **Screenshot upload dance** (`scripts/dharma_asc_screenshots.py`): create
  appScreenshot (reserve) → PUT each uploadOperation part with its headers →
  PATCH `uploaded: true` + md5. Display type `APP_IPHONE_67` covers modern
  iPhones. Delete-then-upload controls ordering.
- **Analytics API**: POST `analyticsReportRequests` with `accessType: ONGOING`
  the day you ship — first report instances take 24–48h to generate, so enable
  it BEFORE you want the data. Faster path for sales units needs the vendor
  number (ASC → Payments & Financial Reports, human-only).
- ASC dashboard data lags ~1–2 days. Never read "no downloads yesterday" as
  failure; check the date range first.

## 4. Google Play — what's manual, what bites

- **Without a service account, these are thumb-only:** AAB upload, screenshots,
  listing text. Play Console's file inputs are created dynamically + native
  dialog — browser automation cannot drive them.
- **Console drafts do NOT auto-submit.** Changes sit in "pending changes" until
  someone presses *Send for review*. (Lost a day of new screenshots to this.)
- Listing changes clear review in hours-to-a-day; binaries similar for an
  established account.
- Play dashboard: "Device acquisitions" ≠ opens. Expect a gap (we saw 5
  acquisitions / 2 first-opens — low-intent installs never open).

## 5. Review-safe content rules (learned, some the hard way)

- **Money + religion (App Store 3.1.1/3.2.1):** any tip/support screen must be
  a tip TO THE DEVELOPER. Never "donate to the temple/charity", never imply a
  physical ritual is performed for the user. Wording lives in
  `src/screens/OfferingScreen.tsx` as a DESIGN LAW comment.
- IAP: needs Paid Apps agreement signed before any product ships.
- Keep the privacy declarations honest and minimal — see §6, it makes both
  stores' privacy forms nearly empty and unchallengeable.

## 6. Zero-key architecture (the thing most worth copying)

The app ships **no credentials at all**:

- Content: public-bucket JSON catalogs on Supabase storage, streamed at runtime.
  New content = upload JSON, no app release.
- Analytics: app POSTs to **our own endpoint** `dharmaweave.com/api/events/app`
  (Cloudflare Pages Function) which holds the Supabase service key server-side
  and inserts into `app_events`. Random install-id, no device identifiers, no
  third-party SDKs. Store privacy forms stay clean; nothing to rotate in-app.
- Client: `src/services/analytics.ts` — offline queue, session split on 30-min
  gap, flush on background.

**Outage armor (added after the 21 Aug Supabase stall blanked every image in
the app for ~1h):** never let the app hit the storage origin directly. Put a
Cloudflare edge cache in front (`DharmaWeave/functions/cdn/[[path]].js`):
media cached 1y immutable; `*.json` manifests get a 5-min fresh TTL plus a
long-lived stale copy served when the origin fails; manifest bodies get the
origin URL prefix rewritten to the CDN on the fly so embedded URLs route
through the cache too. App asset URLs point at `dharmaweave.com/cdn/…` from
day one. Pair with `dharma_uptime_watch.py` (cron 10-min, WhatsApp on state
change only) so an outage is known in minutes, not from users.

**Pitfall that cost us all launch-day click data:** the Supabase key stored in
Cloudflare env had been rotated (`eyJ…` JWT era → `sb_secret_…`), every insert
401'd, and the `catch(()=>{})` swallowed it. Rules:
1. After ANY Supabase key rotation, update Cloudflare project env vars too.
2. Env var changes only apply on the **next deployment** — push an empty commit.
3. Verify the write path end-to-end (insert a row, read it back) before launch.

## 7. The smart link (`/app`) — one URL for every surface

`functions/app.js` on the website. UA-routed:
iOS → App Store 302, Android → Play 302, desktop → landing page with both
buttons. Logs `{platform, source}` to `app_link_clicks` (source = `?s=` tag).

Field-tested webview behaviour — this table is blood-earned:

| Surface | What works |
|---|---|
| Safari / Chrome / X / WhatsApp / FB app | Plain server **302** straight to store |
| **Instagram iOS** | NOTHING automatic. 302 → blank `l.instagram.com` shim; JS jumps, meta refresh, `itms-apps://` buttons all silently eaten. Only a **finger-tap on a plain https store link** works → serve a one-button page for `instagram && iOS` UA only |
| Instagram Android | 302 fine (Play intent is native) |
| HEAD requests (crawlers) | Must return HTML — export `onRequest`, not `onRequestGet`, or previews render the SPA shell as a white page |

Also: `Cache-Control: no-store` on every response — the reply depends on UA,
which is not in Cloudflare's cache key; one desktop hit can poison an edge node
for every phone behind it.

**Tag taxonomy** (free-form, zero setup — anything after `?s=` gets its own
bucket): `fb` `ig` `x` `fbreel` `xreel` `yt` `ytad` `ad` `igboost` `wa`.
One tag per surface per campaign, never reused across purposes.

## 8. Marketing plumbing per platform

**Meta (Graph API v21):**
- Photo carousels can't carry audio anywhere in the API; FB photo posts have no
  audio. Music lives on Reels — and Meta's licensed library is FORBIDDEN in ad
  creative; only own/licensed tracks are ad-safe.
- IG publish is by **public URL**, not upload (images and video both) — assets
  must be web-reachable first. IG has **no delete API** — deleting a live post
  needs the app.
- FB Reels: start session → `rupload` with `file_url` header → poll
  `status.uploading_phase` (a nested object, not a string) → `finish`.
- Ads: religion-related detailed targeting **no longer exists** ("Bhagavad
  Gita", "Hinduism" → zero results). Go broad; the creative self-selects.
- Singapore requires `regional_regulated_categories: ["SINGAPORE_UNIVERSAL"]`
  AND verified advertiser identity — if not verified, drop SG from targeting.
- At tiny budgets (≤S$5/day) run **ONE ad set** — split budgets never exit
  learning. `LINK_CLICKS` optimisation (LPV needs a pixel event on the
  destination; a 302 link never fires one).
- Ad previews are **deliberately inert** — buttons don't click. Show the client
  `preview_shareable_link` instead.
- Placement economics we measured: FB feed cheapest AND biggest (£0.005 CPC);
  IG +65% CPC; Audience Network junk-prone. FB-only placements won.
- Insights lag up to ~1h — "no delivery" right after activation means nothing.

**Download-optimised ads WITHOUT an SDK** (added after the click-campaign
lesson: ~13k clicks → 20 devices at ~0.15%):
- Click/traffic campaigns buy the cheapest tappers; they do not buy installers.
- **Meta**: fire a server-side CAPI `Lead` from the smart-link function on
  every store handoff (fbclid + IP + UA matching; no cookies, no page render —
  the 302 stays). Then run `OUTCOME_LEADS` with
  `promoted_object={pixel_id, custom_event_type: LEAD}` — Meta optimises for
  people who reach the store, the deepest signal available SDK-free. Reuse the
  book funnel's pixel + token (already in Cloudflare env).
- **Google App Campaigns** optimise on real Play installs with NO SDK — link
  Play Console ↔ Google Ads (customer 394-214-6529) once.
- **Apple Search Ads** optimise on real App Store installs with NO SDK, and
  target store searches (highest intent that exists). Enrollment needs the
  account holder at ads.apple.com.
- True Meta/YouTube install objectives need their SDK/Firebase in the app —
  a privacy-posture decision, not a checkbox.

**YouTube:**
- Upload Short via Data API (pattern:
  `scripts/upload_app_reel_to_dharmaweave.py`). Canon: `categoryId: '1'`,
  `notifySubscribers: True`, `selfDeclaredMadeForKids: False`, no `#Shorts` tag,
  keyword-led title with a learn/explained hook.
- **Do not edit title/desc after publish** — throttles impressions, and can
  re-trigger ad review mid-promotion.
- Promote flow: landing page = smart link with its own tag (`?s=ytad` ≠ organic
  `?s=yt`). App-install objective needs Firebase (same SDK trade-off as Meta) —
  use traffic/views objective instead. The public Short URL doubles as the Play
  listing's promo-video field.

**X:**
- Premium account = long single posts (no thread split); 4 images max per post;
  video fine. `402 credits depleted` = API billing, top up in the dev portal.
- X *displays* links scheme-stripped but the t.co entity is correct — users
  copying the display text get `http://` pastes, so the smart link must handle
  scheme-less/http arrivals (301 → https → route: already does).
- Near-duplicate posts from one account get suppressed — vary wording between
  the carousel post and the reel post.

## 9. Measurement reality

- **Own Postgres (`app_events`) is the leading indicator** — near-real-time and,
  we verified, nearly equal to Apple's install count a day early (everyone who
  downloads opens, on iOS). Stores lag 1–2 days.
- Observed funnel benchmarks (devotional vertical, Aug 2026): CTR ~4.5% on the
  reel creative; CPC £0.005–0.009; click→engaged-install ~0.5–2%. Cheap Indian
  Android feed traffic clicks 20× more but converts far worse than iOS/diaspora
  — check platform split before scaling spend.
- Launch cost: ~S$2–4 per engaged device across Meta + IG boost + YT at
  S$5–75/day scale.
- First growth levers in order: ratings from friendly users (a listing with
  zero reviews barely converts), ASO keywords in title/subtitle, then paid.

## 10. Launch-week checklist (condensed, sequential)

1. Bump version (never reuse), EAS build both platforms.
2. Play: `blockedPermissions` set, verify AAB manifest, upload AAB (manual until
   service account), **press Send for review** — drafts don't submit themselves.
3. ASC: new version record → attach build → metadata → screenshots
   (APP_IPHONE_67) → submit. Territories set? Check `appAvailabilityV2`.
4. Enable ASC `analyticsReportRequests` (ONGOING) NOW — 48h lead time.
5. Smart link: clone `functions/app.js`, new store IDs, verify every UA row in
   the §7 table + a real insert into the click table.
6. Creative: carousel (3 cards, 4:5, art-forward card 1 — at feed size a face
   reads, an interface doesn't) + 25s reel (9:16, own music track).
7. Post organic first (FB/IG/X/YT Short), each surface its own `?s=` tag.
8. Ads after organic proof: Meta one ad set FB-placements broad; YT Promote on
   the Short; nothing on X.
9. Ratings push to friendly users on day 2-3.
10. Read Postgres daily; trust stores only from day 3.

---
*Origin: Dharma launch, Aug 2026. Owner: Maya. Update this file when the next
launch teaches something new.*

## v2 release (2026-09-07) — lessons added

- **OTA native-drift gate (do this EVERY time before `eas update` to old runtimes):** diff `package.json` and `app.json` plugins between each live runtime's build commit and HEAD (`git log -S'"version": "X"' -- app.json` finds the commit). Any native module added since that binary must be lazy-required with try/catch, or that runtime crashes at launch. v2 caught `@react-native-community/datetimepicker` (missing from 1.0.4 — 1,383 devices) this way. Also confirm Expo SDK / RN / reanimated versions are identical across runtimes.
- **Which runtimes to publish:** query `app_events` for distinct `app_version` over 30 days; skip dead runtimes. v2 published 1.0.4 / 1.0.6 / 1.0.7 / 1.0.8 (1.0.3 and 1.0.5 had zero devices).
- **Gate the OTA loop on tsc properly** — a `;` after a shell function definition breaks an `&&` chain; v2's loop ran despite a tsc failure (types only, harmless, but don't repeat).
- **iOS submission via ASC API works end-to-end** (appStoreVersions → build relationship → phasedRelease INACTIVE (auto-activates) → whatsNew → reviewSubmissions). Stale empty reviewSubmission drafts can't be cancelled (409) — harmless; reuse one.
- **GitHub push protection** blocks pushes containing the *historical* rotated Supabase key (see SECURITY-NO-KEY-REWRITE.md — no history rewrite by standing decision). Unblock needs Anant's click on the GitHub-provided URL; not a release gate.
- **Noticeboard:** `scripts/publish_noticeboard.py` uploads `config/noticeboard.json` to `dharma-art/config/` — run at OTA time.
- **Android:** EAS `build --platform android --profile production` → AAB; Play upload still manual (no service account).

### Play Console notes after the 1.0.8 release (for the v3 binary)
- Android 1.0.8 released 2026-09-07 15:54 SGT at 20% staged; bump to 100% via Production → Releases → "Manage rollout" after ~48h crash-free.
- Play flags "App optimisation below threshold — Obfuscation (1%) — fix by Feb 2027": enable R8/ProGuard for release builds (expo-build-properties `android.enableProguardInReleaseBuilds: true` + `enableShrinkResourcesInReleaseBuilds`) and upload the mapping file (EAS does this automatically once R8 is on). Under 25% may limit visibility/publishing after the deadline.
- Recommended: migrate off deprecated edge-to-edge APIs (SDK-level; expo edge-to-edge config) and remove resizability/orientation restrictions for large screens (app.json `orientation`, `android.resizeableActivity`). Non-blocking now.
- Release notes are capped at 500 characters per language; the store language is en-GB (tag `<en-GB>`), not en-US.

### TestFlight after a store release — bump the version (learned 2026-09-08)
Once a version (e.g. 1.0.8) is approved/released, Apple closes that "train": any new build with the same CFBundleShortVersionString is rejected AFTER upload with ITMS-90186 (train closed) + ITMS-90062, and EAS still reports "successfully uploaded" — the rejection arrives only by email to the ASC account holder, and the build never appears in App Store Connect. **Rule:** every TestFlight preview after a store release bumps `expo.version` (1.0.8 → 1.0.9). The preview channel (`testflight` profile) keeps it isolated from store OTAs; the bump does not touch store users.

### Vidyā v2.1 OTA (2026-09-08) — the cheap-release template
- JS + content + one bundled mp3, zero native change → OTA only. Four `eas update --branch production` runs (1.0.8 / 1.0.7 / 1.0.6 / 1.0.4), swapping `app.json` version per run and restoring it after (a `trap` guards the restore). Preview runtime 1.0.9 got its own push via `--branch preview` for TestFlight first; production never needed the 1.0.9 binary.
- Drift gate re-run before pushing: 1.0.4 still differs only by datetimepicker (lazy-guarded) + astronomy-engine (pure JS).

### In-app purchases — "Support the creators" (2026-09-08) — WITHDRAWN the same evening
**Founder: "a support-for-creators on a religious app is not clean — let's not go there." No tip jar, ever. Payments only as a clean product (subscription / book). The recipe below is kept for that future case only.**
- Rule: tips to the developer for digital content = IAP on both stores (App Store 3.1.1; Play billing policy). Never a web link, never framed as a donation (Tara Ventures is not a charity).
- Library: `expo-iap` (config plugin auto-added; StoreKit 2 / Play Billing 8). Consumable tiers, ids identical on both stores: `com.taraventures.dharma.support.{small,medium,large}` = $0.29 / $0.99 / $2.99 USD base. `finishTransaction({isConsumable:true})` after every success so the tip can repeat.
- ASC via API: `POST /v2/inAppPurchases` (CONSUMABLE) → `/v1/inAppPurchaseLocalizations` (en-US) → `/v1/inAppPurchasePriceSchedules` (inline price id MUST be `${price-0}`; pick the price point from `/v2/inAppPurchases/{id}/pricePoints?filter[territory]=USA`) → `/v1/inAppPurchaseAvailabilities` (all territories). Transient 500s happen on create — retry.
- Still manual: review screenshot per IAP; attach IAPs to the version on first submission; Play products (no service account) — see `Daily Reviews/app-support-iap/ANANT_CHECKLIST.md`.
- Anant-only: Paid Apps agreement + tax + banking (ASC), Payments profile (Play), Small Business Program. Sandbox tester (ASC) + License testing (Play) for free test purchases.
- Tax: stores are merchant of record (VAT/GST/sales tax collected + remitted by them); SG corporate tax on payouts only.
- Native change → new binary (1.1.0); builds via `testflight` profile (channel preview) for both platforms; store release only on explicit go.
