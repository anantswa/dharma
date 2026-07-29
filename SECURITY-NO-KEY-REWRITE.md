# Dharma app — remove Supabase keys entirely (handoff)

*Written 2026-07-26 by Maya (from the Agentic-dharmaweave thread), for whoever picks up the Dharma app next. Anant's call: **the app should carry no key at all** — it was a design flaw, and the app doesn't need one.*

---

## 1. What happened (read first)

`app.json` → `expo.extra.supabaseKey` contained a **live `sb_secret_…` service-role key** — the same admin key the servers use. That is the most privileged credential in the whole system: it **bypasses Row-Level Security on all 130 tables** of the Agnidev project (`aiwugigdrvijjeoqtpog`).

Why it was serious:
- `app.json` **ships inside the app bundle** — anyone with the build (TestFlight, an APK, a device) can extract it.
- This repo's GitHub remote (`anantswa/dharma`) is **PUBLIC**, and a nightly cron (`Agentic-dharmaweave/scripts/scheduler/macos/run_git_sync.sh`, 23:00 SGT) runs `git add -A && git commit && git push` across every repo in `~/projects`. **10 unpushed commits containing the key were queued.** It hadn't leaked only because pushes had been failing since April.

### Already done (don't redo)
- ✅ Secret **removed** from `app.json` (replaced with `""` + a note) and redacted from 6 files under `agent-framework/reports/`.
- ✅ A **pre-push hook** installed at `.git/hooks/pre-push` that blocks any push while a `sb_secret_` still exists in this repo's git history. *(Tested — push is refused.)*
- ✅ Server-side: RLS enabled on `app_events` and `app_feedback` with **insert-only policies for `anon`**, so even a future anon-key client can write but never read/edit/delete.
- ✅ **Key rotated 2026-07-29.** The exposed `sb_secret_NSb…` key is **revoked and verified dead** (returns HTTP 401). A new server-only key (`server_2026_07`) is in `Agentic-dharmaweave/.env`; all pipelines re-verified working. **The old key in this repo's git history is now inert.**
- ℹ️ The pre-push hook was refined: it now blocks only a *live* service-role key, so normal pushing works again.

---

## 2. The finding that makes this easy

The app barely uses Supabase's API at all:

| Usage | File | Needs a key? |
|---|---|---|
| Analytics events → `rest/v1/app_events` | `src/services/analytics.ts` | **yes** |
| Feedback submit → `rest/v1/app_feedback` | `src/screens/FeedbackScreen.tsx` | **yes** |
| `supabaseQuery()` / `supabaseCount()` | `src/services/supabase.ts` | yes — but **0 callers, dead code** |
| **All audio, images, wallpapers, articles** | `src/data/*.ts`, `imageService`, `panchang`, `dataSync`, `moduleService` | **NO** — these are `…/storage/v1/object/**public**/…` bucket URLs. Public buckets need no credential. |

**So: removing the key breaks nothing except analytics and in-app feedback submission.** Every piece of content, audio, and imagery keeps working untouched.

And the value being given up is near-zero right now: `app_feedback` has **0 rows in its entire lifetime**; `app_events` has **128**. The app is in family test phase.

---

## 3. What to do

### 3.1 Delete the dead client
- Delete `src/services/supabase.ts` (exports `supabaseQuery`, `supabaseCount`, `SUPABASE_URL` — nothing imports them).
- Keep `src/types/supabase.ts` if it's only TypeScript types; delete if it references credentials.

### 3.2 Strip the keys from config
In `app.json` → `expo.extra`, **remove both** `supabaseKey` and `supabaseUrl` (and the `_supabaseKeyNote` placeholder I left).
Then confirm nothing reads them:
```
grep -rn "expoConfig?.extra" src/ | grep -i supabase
```

### 3.3 Make analytics local-only (or remove it)
`src/services/analytics.ts` (93 lines) queues events and POSTs them to `app_events`.
**Simplest:** keep the public `track()` / `flushAnalytics()` API so the **12 files that call `track()` don't need touching**, and make the network flush a no-op — drop the queue, or persist it to `AsyncStorage` for local debugging only.

> Callers (do **not** need edits if you keep the API): `FeedbackScreen`, `FilmPlayerScreen`, `NoticeboardScreen`, `TodayScreen`, `MandirScreen`, `KathaScrollScreen`, `JapaScreen`, `SadhanaScreen`, `SaharaDetailScreen`, `SaharaScreen`, `WallpapersScreen`, `FaithChooser`.

### 3.4 Rewrite feedback submission without a backend
`FeedbackScreen.tsx` currently POSTs `{rating, message, email, app_version, platform}` to `app_feedback`.
Replace with a **`mailto:`** compose via `expo-linking` (zero infrastructure, works offline-ish, family-test appropriate):

```ts
import * as Linking from 'expo-linking';
const body = `Rating: ${rating}\n\n${message}\n\n— v${appVersion} · ${Platform.OS}`;
Linking.openURL(`mailto:anant@tara-ventures.com?subject=Dharma%20app%20feedback&body=${encodeURIComponent(body)}`);
```
Keep the existing success UI/haptics. **Keep the newsletter path as-is** — `SUBSCRIBE_URL = https://dharmaweave.com/api/subscribe` is a normal web endpoint, not Supabase, and needs no key.

Respect the app's privacy stance: feedback stays **opt-in only**, no capture prompts.

### 3.5 Verify
```
grep -rn "sb_secret_\|supabaseKey\|apikey" src/ app.json    # → no results
grep -rn "rest/v1/" src/                                     # → no results
grep -rn "storage/v1/object/public" src/ | wc -l             # → many; these MUST remain
npx tsc --noEmit                                             # → clean
```
Then run the app and confirm: audio plays, images/wallpapers load, articles render, feedback opens the mail composer.

---

## 4. Rules going forward

1. **Never put a `sb_secret_…` key in a client app, ever.** Client bundles are readable — treat anything shipped as public.
2. If analytics/feedback are wanted back later, the correct design is **either**:
   - the **publishable (anon) key** — it is *designed* to ship in clients — combined with the insert-only RLS policies already created server-side for `app_events` / `app_feedback`; **or**
   - a **Supabase Edge Function** (or the existing `dharmaweave.com` API) as a thin proxy, so the app holds no credential at all. *Preferred if the app ever goes public.*
3. **Public storage buckets are fine to reference directly** — that's what they're for. Don't "fix" those URLs.
4. Before any commit here, remember this repo is **public on GitHub** and gets **auto-committed and pushed nightly**. Nothing sensitive belongs in the working tree.
5. Pushing is re-enabled (the historical key is revoked). Leave `.git/hooks/pre-push` in place — it now blocks only *live* secrets, which is exactly the protection this public repo needs.

---

## 5. Open item for Anant

10 local commits are still unpushed, and they contain the **revoked** key. It is inert, so this is hygiene rather than risk. Either push as-is, or squash/scrub those commits first if you'd rather not publish a dead credential to a public repo. Your call — nothing is blocking.
Zero-key rewrite was also EXECUTED 2026-07-28 (W4.6, both runtimes) — see Agentic-dharmaweave/app_canon.md §23.
