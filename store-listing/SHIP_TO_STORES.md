# Ship Dharma to Google Play & Apple App Store

## Pre-requisites

### Accounts Needed
1. **Google Play Developer Account** ($25 one-time fee)
   - Sign up: https://play.google.com/console/signup
   - Requires a Google account (use anant@tara-ventures.com)

2. **Apple Developer Account** ($99/year)
   - Sign up: https://developer.apple.com/programs/enroll/
   - Requires Apple ID
   - Takes 1-2 business days for approval

3. **Expo Account** (free)
   - Sign up: https://expo.dev/signup
   - Already exists: project ID 84d77601-15e9-4ea8-af38-162cf1f96e34

---

## Step 1: EAS Login

```bash
cd ~/projects/dharma-github
eas login
# Enter your Expo credentials
```

## Step 2: Build for Android

```bash
eas build --platform android --profile production
```

This will:
- Build an AAB (Android App Bundle) in the cloud
- Takes ~10-15 minutes
- Download link provided when complete

## Step 3: Build for iOS

```bash
eas build --platform ios --profile production
```

This will:
- Prompt for Apple Developer credentials (Apple ID + app-specific password)
- Generate provisioning profiles automatically
- Build an IPA archive in the cloud
- Takes ~15-20 minutes

**Note:** First iOS build requires you to:
1. Log in with Apple ID when prompted
2. Select your team
3. EAS handles certificates and provisioning automatically

---

## Step 4: Upload to Google Play

### Option A: EAS Submit (Automated)
```bash
# First, create a Google Play service account key:
# 1. Go to Google Play Console > Setup > API access
# 2. Create a service account
# 3. Download the JSON key
# 4. Save as ./google-play-key.json (DO NOT commit this file)

eas submit --platform android --profile production
```

### Option B: Manual Upload
1. Go to https://play.google.com/console
2. Create new app > "Dharma — Daily Wisdom"
3. Fill in store listing (see STORE_DESCRIPTION.md)
4. Upload the AAB file from the EAS build
5. Set content rating: Everyone
6. Set category: Lifestyle
7. Upload screenshots (see below)
8. Add privacy policy URL
9. Submit for review

### Google Play Store Listing Details
- **App name:** Dharma — Daily Wisdom
- **Short description:** Daily spiritual wisdom from Hindu, Buddhist, Sikh, Jain and Zen traditions.
- **Full description:** See STORE_DESCRIPTION.md
- **Category:** Lifestyle
- **Content rating:** Everyone
- **Privacy policy URL:** Host PRIVACY_POLICY.md on GitHub Pages or your website
- **Contact email:** anant@tara-ventures.com

---

## Step 5: Upload to Apple App Store

### Option A: EAS Submit (Automated)
```bash
# You need your App Store Connect App ID
# 1. Go to https://appstoreconnect.apple.com
# 2. Create new app with bundle ID: com.taraventures.dharma
# 3. Note the Apple ID (numeric) shown in App Information
# 4. Update eas.json with the ascAppId

eas submit --platform ios --profile production
```

### Option B: Manual via Transporter
1. Download "Transporter" from Mac App Store
2. Upload the IPA file from EAS build
3. Go to App Store Connect > create app listing
4. Fill in metadata, screenshots, description
5. Select the build
6. Submit for review

### App Store Listing Details
- **App name:** Dharma — Daily Wisdom
- **Subtitle:** Sacred wisdom from five traditions
- **Category:** Lifestyle (Primary), Education (Secondary)
- **Age Rating:** 4+
- **Privacy:** Select "Data Not Collected"
- **Privacy Policy URL:** (same as Android)

---

## Step 6: Screenshots

You need screenshots at these sizes:

### Android (Google Play)
- Phone: 1080x1920 or 1440x2560 (min 2, max 8)
- Tablet 7": 1200x1920 (optional)
- Tablet 10": 1800x2560 (optional)

### iOS (App Store)
- iPhone 6.7" (1290x2796) — required
- iPhone 6.5" (1242x2688) — required
- iPhone 5.5" (1242x2208) — required
- iPad 12.9" (2048x2732) — optional

### How to Capture
Best approach: Run the app on a real device or emulator and take screenshots.

```bash
# Start the app
npx expo start

# On Android emulator (if available):
adb exec-out screencap -p > screenshot.png

# On iOS Simulator (Mac only):
# Cmd+S in Simulator to save screenshot
```

### Screens to Capture (6 screenshots recommended)
1. **Home** — Temple darshan with deity
2. **Dashboard** — Daily wisdom + upcoming festivals
3. **Wisdom Library** — Tradition filter pills + quote cards
4. **Sacred Calendar** — Monthly festival list
5. **Learn** — Hanuman Chalisa module
6. **Store** — DharmaWeave products

---

## Step 7: Privacy Policy Hosting

Option A: GitHub Pages
1. Enable GitHub Pages on anantswa/dharma repo (Settings > Pages)
2. The privacy policy will be at: https://anantswa.github.io/dharma/store-listing/PRIVACY_POLICY

Option B: Simple URL
- Host the PRIVACY_POLICY.md content at any URL you control
- Both stores require a live URL

---

## Important Files

| File | Purpose |
|------|---------|
| `app.json` | App config (name, version, bundle IDs, icons) |
| `eas.json` | Build + submit configuration |
| `store-listing/STORE_DESCRIPTION.md` | Store descriptions + keywords |
| `store-listing/PRIVACY_POLICY.md` | Privacy policy text |
| `store-listing/SHIP_TO_STORES.md` | This file — deployment guide |
| `assets/images/icon1.png` | App icon (1024x1024) |

## Bundle Identifiers
- **Android:** com.taraventures.dharma
- **iOS:** com.taraventures.dharma

## Files NOT to Commit
- `google-play-key.json` — Google Play service account key
- Any Apple certificates or provisioning profiles

---

## Timeline
- Google Play review: 1-3 days (first submission can take up to 7 days)
- App Store review: 1-2 days (first submission can take up to 7 days)

## Quick Ship Checklist
- [ ] EAS login working
- [ ] Android build succeeds
- [ ] iOS build succeeds
- [ ] Google Play Developer account active
- [ ] Apple Developer account active
- [ ] Screenshots captured (6 per platform)
- [ ] Privacy policy hosted at a live URL
- [ ] Store descriptions filled in
- [ ] Builds uploaded to stores
- [ ] Submitted for review
