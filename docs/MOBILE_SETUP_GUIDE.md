# McAforo Mobile — Setup Guide (Manual Steps)

This doc lists the **manual, one-time actions** that must be performed outside the
codebase to move the mobile app from "scaffolded" to "published in the stores."
Everything else is already implemented and committed.

---

## 1. Developer accounts (start first — identity checks take days)

### Apple Developer Program
1. https://developer.apple.com/programs/ → enrol. **$99 / year.**
2. Identity verification: can take 24–48 h.
3. Create an **App Store Connect** record for "McAforo" (bundle id `com.mcaforo.app`).
4. In **Users and Access → Integrations → App Store Connect API**, create a key
   and download the `.p8` file. Paste into `eas.json` via `eas credentials`.

### Google Play Console
1. https://play.google.com/console → enrol. **$25 one-time.**
2. Identity verification: can take 1–3 days.
3. Create an "internal app" for `com.mcaforo.app`.
4. In **API access**, create a service account with **Release Manager** role,
   download the JSON key, and save it as `apps/mobile/google-play-service-account.json`
   (this path is already in `.gitignore`).

---

## 2. Firebase / FCM

Expo routes Android push through FCM and iOS through APNs via the Expo servers;
no direct Firebase wiring is required for messages, **but** Android builds still
need an FCM credential.

1. https://console.firebase.google.com/ → **Add project** → `mcaforo-mobile`.
2. **Add app → Android** → package name `com.mcaforo.app`.
3. Download `google-services.json` and place it at `apps/mobile/google-services.json`.
4. In Firebase → **Project settings → Cloud Messaging** → enable FCM API.
5. Create a service account for FCM v1 → download JSON.
6. Upload to Expo: `eas credentials` → select Android → **FCM V1** → paste service account.

For iOS, Expo handles APNs using the Apple push key uploaded in step 1.3.

---

## 3. Expo / EAS

Inside `apps/mobile`:

```powershell
npm install
npx expo install --fix
npx eas login
npx eas init         # creates the project + fills EAS_PROJECT_ID
```

Then set the `EAS_PROJECT_ID` into `apps/mobile/app.config.ts` `extra.eas.projectId`
(or as an EAS secret).

### Credentials

```powershell
# Once per platform, interactive:
npx eas credentials
#   iOS   → set up distribution cert + provisioning profile + push key (.p8)
#   Android → upload FCM service account + create upload keystore
```

### First dev build

```powershell
npx eas build --profile development --platform android   # ~10–15 min
npx eas build --profile development --platform ios       # ~15–20 min
```

Install the resulting APK / IPA on your physical device (simulators cannot test
push notifications).

---

## 4. Environment variables (Vercel — for the backend)

Add these on the Vercel project that hosts the web app:

| Variable | Value |
|---|---|
| `MOBILE_MIN_APP_VERSION` | e.g. `1.0.0` (force-upgrade older installs below this) |
| `MOBILE_LATEST_APP_VERSION` | e.g. `1.1.0` |
| `MOBILE_FORCE_UPDATE` | `true` to force on launch, else omit |
| `APP_MAINTENANCE_MODE` | `true` while the app is down for maintenance |
| `EXPO_ACCESS_TOKEN` | (optional) for server→Expo Push authentication |

These are read by `@/app/api/v1/config/app/route.ts` and
`@/lib/notifications/push.ts`.

---

## 5. App Store Connect metadata

- **App name:** McAforo
- **Subtitle:** Cloud solutions for modern businesses
- **Category:** Business (primary) / Productivity (secondary)
- **Age rating:** 4+ (no objectionable content)
- **Sign in with Apple:** REQUIRED once Google login is added (Guideline 4.8)
- **Privacy → Data Safety:** declare email, name, device ID, push token, analytics
- **Screenshots:** iPhone 6.7" + 6.5" + 5.5", iPad 12.9" (required sizes)
- **App Review notes:** mention that payments are B2B invoices for real-world
  services (exempt from 3.1.1 in-app purchase requirement)

## 6. Google Play Console metadata

- **Short description:** 80 chars
- **Full description:** 4000 chars max
- **Feature graphic:** 1024 × 500
- **Phone screenshots:** 2–8 images, 1080 × 1920 recommended
- **Data safety form:** must match App Store Connect privacy declarations
- **Content rating:** IARC questionnaire → "Everyone"
- **Staged rollout:** start at 10% → 50% → 100% over 1–2 weeks

---

## 7. Release flow

```
main (git)  ──►  Vercel deploy (web + backend)
                │
                ├──►  eas build --profile production
                │       ├─ iOS     ──►  eas submit -p ios      → TestFlight → App Store
                │       └─ Android ──►  eas submit -p android  → Play Internal → Production
                │
                └──►  eas update --channel production           (OTA JS-only fixes)
```

- **Native changes** (new permissions, new native modules) require a new build + store submission.
- **JS-only changes** (bug fixes, copy, minor UI) ship via `eas update` instantly.

---

## 8. Checklist before launch

- [ ] Apple + Google accounts fully enrolled
- [ ] Firebase project + `google-services.json` placed
- [ ] `eas init` run; `EAS_PROJECT_ID` set
- [ ] All 5 brand assets in `apps/mobile/assets/` (see `docs/MOBILE_ASSETS.md`)
- [ ] Privacy policy + terms URLs are live on `mcaforo.com/privacy` and `/terms`
- [ ] Push tested on a physical device (simulator cannot receive push)
- [ ] Biometric unlock tested on a device with enrolment
- [ ] Refresh-token rotation tested (let access token expire, confirm auto-refresh)
- [ ] Production API URL confirmed in `app.config.ts` production profile
- [ ] App Review submission screenshots taken on the largest required device
- [ ] Staged rollout plan agreed with stakeholders
