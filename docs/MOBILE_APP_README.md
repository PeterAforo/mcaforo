# McAforo Mobile (Expo)

React Native + Expo Router + TypeScript app for Android and iOS.

## Prerequisites

- Node 20+, pnpm or npm
- Android Studio + emulator OR Xcode + iOS simulator
- An active McAforo backend (defaults: `http://10.0.2.2:3000` for Android emulator)

## Getting started

```powershell
cd apps/mobile
pnpm install           # or: npm install
pnpm start             # launches Expo dev server

# In another terminal:
pnpm android           # open in Android emulator
pnpm ios               # open in iOS simulator (macOS only)
```

## Environment

Override the API base URL per environment via `EXPO_PUBLIC_API_URL` or the
`APP_ENV` variable read in `app.config.ts`:

| `APP_ENV`     | API URL default                     |
| ------------- | ----------------------------------- |
| development   | `http://10.0.2.2:3000` (Android)    |
| preview       | `https://staging.mcaforo.com`       |
| production    | `https://mcaforo.com`               |

## Project layout

```
app/                     # Expo Router file-based routes
  _layout.tsx            # Root provider + auth gate
  (auth)/                # login, signup, forgot-password
  (app)/                 # tabs: home, invoices, projects, tickets, account
src/
  api/                   # axios client + typed endpoints
  store/                 # Zustand auth store + SecureStore wrapper
  lib/                   # push, biometrics, deep-linking
  components/            # UI primitives (Button, Field, Card, Screen)
  theme/                 # color/spacing/radius tokens
```

## Key features

- Email + password auth against `/api/v1/auth/login`
- Access/refresh token rotation with single-flight refresh-on-401
- Expo SecureStore for token persistence (Keychain / Keystore)
- Push notifications via Expo (FCM on Android, APNs on iOS)
- Biometric unlock (Face ID / fingerprint)
- Deep linking: `mcaforo://` + `https://mcaforo.com/app/*`
- TanStack Query for server state + infinite scroll

## Builds

See `docs/MOBILE_SETUP_GUIDE.md` at the repo root for:

1. Firebase / FCM setup
2. Apple Developer + Google Play enrolment
3. EAS Build + submit commands
