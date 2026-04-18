# McAforo — Mobile App Strategy Report

**Generated:** 2026-04-18
**Project:** `mcaforo-web-portal` (Next.js 16 web app + CMS + client portal)
**Scope:** Connected Android + iOS mobile application consuming the existing McAforo backend.

---

## 1. Executive Summary

McAforo is a **Next.js 16 (App Router) + React 18 + TypeScript** web application with:

- A **marketing site** (home, about, services, products, blog, case studies, contact, newsletter).
- A **client portal** under `/portal` (projects, invoices, tickets, billing, settings).
- A full **in-house CMS** under `/admin` (content, media, menus, redirects, API keys, webhooks, revisions, scheduled publishing, audit logs, command palette).
- A **Prisma + PostgreSQL** data layer and **JWT-in-httpOnly-cookie** authentication.
- A **public versioned API** at `/api/v1/content` secured by API keys + scopes.
- A **Paystack-style payments** flow (`/api/payments/*`), a **chat widget**, a **contact form** with rate limiting, and **Vercel cron** for scheduled jobs.

**Primary recommendation:** **React Native + Expo (TypeScript)**. It reuses the team's React/TS skillset, the existing `zod` schemas, types, and API client patterns, and integrates cleanly with the JWT API once a few backend changes are made.

**Secondary recommendation:** **Capacitor** wrapping a mobile-optimised Next.js build — only as a *fast path* to a v0 Play/App Store presence while the real React Native app is built in parallel.

**High-level timeline (medium app, 2 devs):** **10–14 weeks** end-to-end including backend hardening, native features, store submission, and staged rollout.

---

## 2. Web App Analysis Summary

### 2.1 Tech stack detected

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, server components, `app/` dir) |
| Language | TypeScript 5.3 |
| UI | React 18, Tailwind CSS 3.4, Radix UI, Framer Motion 12, Lucide |
| Fonts | Google Poppins via `next/font` |
| 3D / Hero | `@splinetool/react-spline` |
| Rich text | TipTap v3 (+ extensions) |
| Forms | `react-hook-form` + `zod` resolvers |
| Auth | JWT via `jose` + `bcryptjs`, stored in **httpOnly cookie** `session` (7-day expiry) |
| DB | PostgreSQL via Prisma 5.10 |
| Email | `nodemailer` |
| Storage | Local filesystem (`MEDIA_ROOT`) — portable to S3-compatible later |
| Queue | `pg-boss` (optional) + Vercel cron fallback (`vercel.json` → `/api/cron/...`) |
| Sanitization | `isomorphic-dompurify`, `file-type` |
| Deployment | Vercel |

### 2.2 Feature inventory & mobile classification

| Feature | Surface | Classification |
|---|---|---|
| Marketing home / hero / sections | Public | **UI only** (consumes CMS API) |
| Blog (DB-backed, TipTap) | Public | Requires API |
| Services / Products / Case studies | Public | Requires API |
| Contact form (rate-limited) | Public | Requires API |
| Newsletter subscribe | Public | Requires API |
| Login / signup / verify / forgot-password | Auth | Requires API + secure storage |
| Client **Portal**: projects, invoices, tickets, billing, settings | Authed | Requires API |
| **Admin CMS** (content, media, menus, redirects, API keys, etc.) | Authed (admin roles) | Requires API — **out of scope for v1 mobile** |
| TipTap rich text editor | Admin | **Web-only** for v1 |
| Payments (Paystack-style initialize/verify/webhook) | Authed | Requires API + WebView/SDK |
| Chat widget | Public | Requires API (could use push) |
| Media uploads | Authed | Requires API + device camera/picker |
| Scheduled publishing / cron | Backend | N/A (backend only) |

### 2.3 API layer

- **REST** (Next.js Route Handlers under `app/api/*`).
- Auth layer: session cookie only — **no bearer/JWT support yet** (critical gap for mobile).
- Public API is versioned at `/api/v1/content` and uses `X-API-Key` headers with scopes.
- No OpenAPI / Swagger spec committed.
- CORS is implicit (same-origin); not configured for cross-origin mobile clients.
- No pagination primitives standardised; listing routes exist per resource.

### 2.4 Real-time / device-adjacent features

- No WebSocket / SSE usage detected.
- No browser Push API / service worker installed.
- Chat widget is request/response (suitable for HTTP; push for inbound).
- `localStorage` / `cookies` are used for session and UI state — **must be abstracted for mobile**.

---

## 3. Technology Recommendation (Ranked)

| Rank | Approach | Fit for McAforo | Verdict |
|---|---|---|---|
| **1** | **React Native + Expo (TS)** | Reuses React/TS, Zod, types; large ecosystem; Expo SecureStore, Notifications, Camera; EAS Build + OTA | **PRIMARY** |
| 2 | **Capacitor** wrapping Next.js | Fastest to store; 100% web reuse; cannot use SSR on device; WebView limits UX | **Tactical v0 / fallback** |
| 3 | **Flutter** | Best UI perf; separate Dart codebase; loses TS/Zod/type reuse | Viable but costly for this team |
| 4 | **Kotlin Multiplatform Mobile** | Good if team were Kotlin-heavy; it isn't | Not recommended |
| 5 | **Native (Kotlin + Swift)** | Highest cost; no code reuse; overkill for CRUD+auth+push | Not recommended |

### 3.1 Justification for React Native + Expo

1. The codebase is **React + TypeScript + Zod + react-hook-form** — all directly reusable patterns.
2. **Expo SDK** covers every native feature we need: `expo-secure-store` (Keychain/Keystore), `expo-notifications` (FCM/APNs), `expo-image-picker`, `expo-local-authentication` (biometrics), `expo-linking` (deep links), `expo-camera`, `expo-file-system`.
3. **EAS Build + EAS Update** give us CI and OTA updates — avoid a forced store update for bug fixes.
4. A **monorepo** (Turborepo + PNPM workspaces) lets the web and mobile app share `@mcaforo/types`, `@mcaforo/api-client`, `@mcaforo/validators` (all Zod schemas), `@mcaforo/config`.
5. **TanStack Query** mirrors the request/caching patterns already familiar from Next.js server components.

### 3.2 When to use the Capacitor fallback

If leadership needs **an app in the store in 3–4 weeks** for signalling/partnership reasons, ship a Capacitor wrapper of `/portal` alongside the real RN build. Mark it internal-only via TestFlight + Closed Testing.

---

## 4. Architecture Blueprint

```
┌────────────────────────┐        ┌──────────────────────────┐
│  Mobile App (Expo RN)  │        │   Web App (Next.js 16)   │
│  iOS + Android         │        │   React Server Components│
└──────────┬─────────────┘        └──────────────┬───────────┘
           │  HTTPS + JSON                        │
           │  Authorization: Bearer <access_jwt>  │  Cookie: session
           │  X-Device-Id, X-App-Version          │
           ▼                                      ▼
┌────────────────────────────────────────────────────────────┐
│           McAforo API  (Next.js Route Handlers)             │
│  /api/auth/*  /api/v1/*  /api/portal/*  /api/admin/*        │
│  Auth resolver: bearer OR cookie  →  SessionUser            │
│  Rate limit + audit + revalidateTag (cache)                 │
└──────────────┬───────────────────────┬─────────────────────┘
               │                       │
         ┌─────▼──────┐          ┌─────▼──────┐
         │ PostgreSQL │          │ Media (FS  │
         │  (Prisma)  │          │  → S3 v1.1)│
         └────────────┘          └────────────┘
               │
         ┌─────▼──────┐   ┌─────────────┐   ┌──────────────┐
         │  pg-boss   │   │  FCM / APNs │   │ Vercel Cron  │
         │  (jobs)    │   │  (push)     │   │ (scheduled)  │
         └────────────┘   └─────────────┘   └──────────────┘
```

### 4.1 Navigation

- **Root stack**: `AuthStack` (login, signup, forgot, verify) ↔ `AppStack`.
- **AppStack** = **Bottom tabs**: `Home`, `Projects`, `Invoices`, `Tickets`, `Account`.
- Inside each tab: a native `Stack` for detail screens.
- **Deep linking**: `mcaforo://` + universal links `https://mcaforo.com/app/*` mapping to the same routes.

### 4.2 State & data

- **Zustand** for auth/session/ui/theme.
- **TanStack Query** for all server state (automatic cache, retry, refetch-on-focus, pagination).
- **Axios** client with interceptors: attach `Authorization: Bearer`, auto-refresh on 401, single-flight refresh queue.
- **MMKV** for non-sensitive cache (feature flags, last-viewed invoice id).
- **Expo SecureStore** for `access_token`, `refresh_token`, `device_id`.
- **Expo SQLite + Drizzle** only for offline-read features in phase 2 (invoices list, ticket threads).

### 4.3 Environment config

- `app.config.ts` reads `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_ENV` (`dev|staging|prod`).
- Three EAS profiles: `development`, `preview`, `production`, each with its own API base URL and Sentry DSN.

### 4.4 Updates

- **EAS Update** for JS-only fixes (no native changes) → same-day rollout.
- Native changes → full store submission.

---

## 5. API Readiness Audit

Legend: `READY` | `NEEDS_MOD` | `MISSING`.

| Endpoint | Method | Status | Issue | Recommendation | Priority |
|---|---|---|---|---|---|
| `/api/auth/login` | POST | **NEEDS_MOD** | Only sets httpOnly cookie; no bearer token returned | Return `{ access_token, refresh_token, user }` when `X-Client: mobile` header (or add `/api/auth/mobile/login`) | **CRITICAL** |
| `/api/auth/signup` | POST | NEEDS_MOD | Same cookie-only issue | Return tokens for mobile clients | **CRITICAL** |
| `/api/auth/verify` | POST | READY | Token-in-URL flow works | Ensure deep link `mcaforo://verify?token=...` routes | HIGH |
| `/api/auth/forgot-password` | POST | READY | — | Deep link the reset URL | HIGH |
| `/api/auth/reset-password` | POST | READY | — | — | HIGH |
| `/api/auth/logout` | POST | NEEDS_MOD | Clears cookie only | Also revoke refresh token + unregister device token | **CRITICAL** |
| `/api/auth/me` | GET | NEEDS_MOD | Cookie-only auth | Accept bearer | **CRITICAL** |
| `/api/auth/refresh` | POST | **MISSING** | No refresh flow exists | Add rotating refresh token endpoint | **CRITICAL** |
| `/api/auth/revoke` | POST | **MISSING** | — | Add revoke-all-sessions | HIGH |
| `/api/devices/register` | POST | **MISSING** | No device token storage | Add + Prisma `Device` model | **CRITICAL** |
| `/api/devices/:id` | DELETE | **MISSING** | — | Add unregister | **CRITICAL** |
| `/api/users/notification-preferences` | GET/PUT | **MISSING** | — | Add | HIGH |
| `/api/v1/content/*` | GET | READY | API-key-authed, versioned, scoped | Allow user-JWT alternative for in-app consumption | MEDIUM |
| `/api/projects` | GET/POST | NEEDS_MOD | Likely un-paginated | Add cursor pagination: `?cursor=&limit=20` returning `{ items, nextCursor }` | HIGH |
| `/api/invoices` | GET | NEEDS_MOD | Same | Cursor pagination | HIGH |
| `/api/tickets` | GET/POST | NEEDS_MOD | Same | Cursor pagination + real-time (SSE or polling every 30s for v1) | HIGH |
| `/api/contact` | POST | READY | Rate-limited | — | LOW |
| `/api/newsletter/subscribe` | POST | READY | — | — | LOW |
| `/api/payments/initialize` | POST | NEEDS_MOD | Returns web redirect URL | Return both `authorization_url` (WebView) and optional mobile SDK reference | HIGH |
| `/api/payments/verify` | GET/POST | READY | — | Handle via deep link `mcaforo://payments/verify?reference=...` | HIGH |
| `/api/payments/webhook` | POST | READY | Server-to-server | — | — |
| `/api/chatbot` | POST | READY | — | Add push notification when operator replies | MEDIUM |
| `/api/admin/media` (upload) | POST | NEEDS_MOD | Expects browser multipart | Ensure mobile `multipart/form-data` with correct `Content-Type` works; add image resize | MEDIUM |
| `/api/health` | GET | **MISSING** | No connectivity probe | Add `GET /api/health` returning `{ ok: true, version }` | HIGH |
| `/api/config/app` | GET | **MISSING** | — | Return min supported app version, feature flags, maintenance flag | HIGH |

### 5.1 Cross-cutting gaps

- **No OpenAPI spec.** Generate one (`next-swagger-doc` or hand-written YAML under `docs/openapi.yaml`) and run `openapi-typescript` to emit `@mcaforo/types`.
- **CORS** must be extended to allow the mobile origin only if using Capacitor (native fetch bypasses CORS).
- **API versioning** must be extended from `/api/v1/content` to all externally-consumed endpoints (portal, auth). Introduce `/api/v1/auth`, `/api/v1/portal/*`.
- **Error shape** is inconsistent. Standardise to `{ error: { code, message, details? } }` with correct HTTP status codes.

---

## 6. Authentication Strategy

### 6.1 Flow

```
┌─ Login (email+pwd | Google | Apple) ─┐
│                                      │
│   POST /api/v1/auth/login            │──▶ { access_token (15m), refresh_token (30d), user }
│                                      │
│   Store in SecureStore:              │
│     - access_token                   │
│     - refresh_token                  │
│     - device_id (uuid, first-run)    │
└──────────────────────────────────────┘
          │
          ▼
  POST /api/v1/devices/register
     { device_id, platform, push_token, app_version }
          │
          ▼
  App routes based on auth state; axios interceptor auto-refreshes on 401.
```

### 6.2 Tokens

- **Access token**: JWT (HS256 with existing `AUTH_SECRET`), **15-minute TTL**, claims `{ sub, email, roles, type: 'access' }`.
- **Refresh token**: opaque random 256-bit string hashed (SHA-256) in a new `RefreshToken` table `(id, userHash, deviceId, expiresAt, revokedAt, rotatedFromId)`. **30-day rolling**, **single-use**, rotated on every refresh.
- Reuse detection: if an already-rotated token is presented, revoke the entire family + force re-login.

### 6.3 Social login

- **Google**: `expo-auth-session` with PKCE. Backend adds `POST /api/v1/auth/google` verifying ID token against Google's JWKS.
- **Apple**: `expo-apple-authentication`. Backend adds `POST /api/v1/auth/apple` verifying identity token against Apple's JWKS. **MANDATORY on iOS if Google login is offered** — App Store Guideline 4.8.
- **Magic link** (optional, later).

### 6.4 Biometrics

- After first successful login, prompt user to enable **Face ID / Touch ID / Fingerprint** via `expo-local-authentication`.
- On enable: store refresh token under a SecureStore key gated by `requireAuthentication: true` + `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
- On app launch: if biometrics enabled, prompt → use refresh token → get new access token → proceed. Otherwise show login.

### 6.5 Logout

1. `POST /api/v1/auth/logout` with refresh token in body → backend revokes refresh family + deletes `Device`.
2. `DELETE SecureStore` all auth keys.
3. Unregister push token with FCM/APNs via `expo-notifications`.
4. Reset TanStack Query cache.
5. Navigate to AuthStack.

### 6.6 Session expiry UX

- 401 in interceptor → attempt refresh. If refresh fails → clear tokens → navigate to login, preserving the attempted deep link for post-login redirect.

### 6.7 Backend changes for auth (summary)

- New Prisma models: `RefreshToken`, `Device`.
- New endpoints: `/api/v1/auth/{login,signup,refresh,logout,revoke,google,apple,me}`, `/api/v1/devices/{register,unregister}`.
- Shared resolver: `resolveUser(req)` returns user from **Bearer OR cookie** — replaces `getSession()` in route handlers.

---

## 7. Push Notification Architecture

### 7.1 Service choice

**Expo Notifications + Firebase Cloud Messaging (FCM v1) for both platforms.** Expo proxies APNs for iOS out-of-the-box; we pay nothing extra and keep a single SDK.

### 7.2 Flow

```
User logs in
   │
   ▼
Ask permission (contextually, after value-first screen) → expo-notifications
   │
   ▼
Get Expo push token (or device push token if bare)
   │
   ▼
POST /api/v1/devices/register { expoPushToken, platform, deviceId, appVersion, locale }
   │
   ▼
Backend stores in `Device`; deduplicates by (userId, deviceId)
```

### 7.3 Notification types (mapped from existing web flows)

| Trigger (web) | Mobile push type | Deep link |
|---|---|---|
| New invoice issued | `invoice.new` | `mcaforo://invoices/:id` |
| Invoice payment confirmed | `invoice.paid` | `mcaforo://invoices/:id` |
| Ticket reply from support | `ticket.reply` | `mcaforo://tickets/:id` |
| Project status change | `project.updated` | `mcaforo://projects/:id` |
| Newsletter / blog published | `content.new` | `mcaforo://blog/:slug` |
| Contact-form reply (if operator replies) | `chat.reply` | `mcaforo://chat` |
| Scheduled publish fired (admin) | `admin.publish` | `mcaforo://admin/content/:id` |

### 7.4 Payload schema

```json
{
  "title": "Invoice INV-0142 is ready",
  "body": "USD 1,250.00 due 2026-05-02",
  "data": {
    "type": "invoice.new",
    "resource_id": "inv_01HW...",
    "deep_link": "mcaforo://invoices/inv_01HW...",
    "action": "view"
  },
  "badge": 3,
  "sound": "default",
  "image": "https://cdn.mcaforo.com/invoices/inv_01HW.../cover.png"
}
```

### 7.5 Backend dispatch

- New service `lib/notifications/push.ts` — wraps Expo Push API (`https://exp.host/--/api/v2/push/send`) with batching (max 100/req) and receipts polling after 15 min.
- Hook into existing notification triggers (currently email-only via `nodemailer`) by adding a `notifyUser(userId, type, payload)` facade that fans out to email **and** push based on user preferences.
- Add `NotificationPreference` model: `(userId, type, email, push)`.

### 7.6 Client handling

- Foreground: show in-app toast + update TanStack Query cache.
- Background tap: route via `expo-linking` to `data.deep_link`.
- Silent data push: `content-available: 1` for cache warm-up (e.g., refresh invoice list on `invoice.new`).

### 7.7 Badge count

- Server includes `badge` = current unread count.
- Client calls `Notifications.setBadgeCountAsync(badge)` on receive and on app foreground (refetch from `/api/v1/portal/unread-count`).

---

## 8. Offline Support & Sync Strategy

### 8.1 Classification

| Feature | Mode |
|---|---|
| Marketing content (home, blog, services) | **CACHED_READ** — TanStack Query `staleTime: 1h`, persist cache |
| Invoices list + details | **CACHED_READ** — SQLite mirror |
| Tickets list + thread | **OFFLINE_READ_WRITE** — queue replies when offline |
| Payments flow | **ONLINE_ONLY** |
| Auth | **ONLINE_ONLY** |
| Profile edit | **OFFLINE_READ_WRITE** — optimistic |
| Notifications list | **CACHED_READ** |
| Chat widget | **ONLINE_ONLY** |

### 8.2 Stack

- **TanStack Query** with `@tanstack/query-async-storage-persister` backed by MMKV.
- **Expo SQLite + Drizzle** only for large relational sets (invoice line items, ticket messages).
- **Netinfo** (`@react-native-community/netinfo`) for connectivity events.

### 8.3 Sync queue (ticket replies, profile edits)

- Pending mutation → write to SQLite `OutboxEntry { id, url, method, body, retries }` → optimistic UI update → mark `pendingServer: true`.
- On connectivity restored → drain outbox serially per entity → server returns authoritative record → replace optimistic row → clear entry.
- **Conflict rule:** **Server-wins** for all mutable fields except `ticket.message.body` which is append-only so conflicts are impossible.

### 8.4 Offline UI

- Global top banner: "You're offline — changes will sync when you reconnect."
- List screens: show last-synced timestamp footer.
- Write-actions disabled when offline for ONLINE_ONLY features; enabled with pending-badge for OFFLINE_READ_WRITE.

---

## 9. Native Device Feature Integration Plan

| Feature | McAforo use-case | Package (RN/Expo) | iOS permission | Android permission |
|---|---|---|---|---|
| Camera | Ticket attachments, avatar | `expo-image-picker`, `expo-camera` | `NSCameraUsageDescription` = "McAforo uses your camera so you can attach photos to support tickets and update your profile picture." | `android.permission.CAMERA` |
| Photo library | Same | `expo-image-picker` | `NSPhotoLibraryUsageDescription` = "McAforo accesses your photos to attach them to tickets and messages." | `READ_MEDIA_IMAGES` (API 33+) |
| Documents | Upload invoices/receipts | `expo-document-picker` | — | — |
| Push notifications | Invoice/ticket/project alerts | `expo-notifications` | Prompted at runtime | `POST_NOTIFICATIONS` (API 33+) |
| Biometrics | Quick login | `expo-local-authentication` | `NSFaceIDUsageDescription` = "McAforo uses Face ID to unlock your account securely." | `USE_BIOMETRIC` |
| Secure storage | Tokens | `expo-secure-store` | — | — |
| Haptics | Confirmations | `expo-haptics` | — | `VIBRATE` |
| Clipboard | Invoice ref, API keys | `expo-clipboard` | — | — |
| Share | Share invoice PDF, referral | `expo-sharing` | — | — |
| File system | Download invoice PDFs | `expo-file-system` | — | — |
| Deep linking | Email links, verify, payments | `expo-linking` | Associated Domains entitlement | Intent filters in `AndroidManifest.xml` |
| Analytics | Usage metrics | PostHog React Native or Firebase Analytics | `NSUserTrackingUsageDescription` (if using IDFA) | — |
| Crash reporting | Stability | `@sentry/react-native` | — | — |

**Geolocation is NOT required** — no location features in current web app. Omit to avoid App Store scrutiny.

**In-App Purchases NOT required** — payments are B2B invoice-based via Paystack. Apple permits external payment for "real-world goods/services"; document this in the App Review notes to avoid rejection under 3.1.1.

---

## 10. Shared Code Strategy (Monorepo)

### 10.1 Proposed layout (Turborepo + PNPM)

```
/
├─ apps/
│  ├─ web/         ← existing Next.js app (this repo, moved)
│  └─ mobile/      ← Expo app (new)
├─ packages/
│  ├─ types/       ← Prisma-derived types, DTOs, OpenAPI-generated
│  ├─ validators/  ← ALL Zod schemas (login, signup, contact, newsletter, CMS)
│  ├─ api-client/  ← typed fetch wrapper + endpoints: web uses fetch, mobile uses axios
│  ├─ utils/       ← formatters (currency, date, slug), pure logic
│  ├─ config/      ← constants, enums, feature flags, env schema
│  └─ ui-tokens/   ← color/spacing/type tokens → consumed by Tailwind (web) + NativeWind (mobile)
├─ docs/
└─ turbo.json
```

### 10.2 What gets extracted now

- **Zod schemas** already in `lib/validators/*` and inline in routes → `@mcaforo/validators`.
- **Permissions matrix** in `lib/auth/permissions.ts` → `@mcaforo/config`.
- **Formatters** (date, currency) from `lib/utils.ts` → `@mcaforo/utils`.
- **Prisma types** via `prisma generate` → re-exported DTOs in `@mcaforo/types`.
- **Design tokens** from `tailwind.config.ts` → `@mcaforo/ui-tokens`, consumed by NativeWind.

### 10.3 What stays web-only

TipTap editor, Spline hero, MDX blog loader, admin UI, `rehype-*` / `shiki`, server components, Radix primitives.

### 10.4 Code generation

Once `docs/openapi.yaml` exists: `pnpm -w gen:api` runs `openapi-typescript` + `openapi-fetch` and emits a typed client into `packages/api-client/src/generated/`.

---

## 11. Backend Changes Required (Checklist)

### Auth

- [ ] Add Prisma models `RefreshToken`, `Device`, `NotificationPreference`.
- [ ] New routes under `/api/v1/auth/*`: `login`, `signup`, `refresh`, `logout`, `revoke`, `google`, `apple`, `me`.
- [ ] Refactor `lib/auth.ts` → `resolveUser(req)` supports **Bearer `Authorization`** in addition to `session` cookie.
- [ ] 15-minute access JWT, 30-day rotating refresh token, reuse detection.
- [ ] PKCE verification for Google; Apple identity token verification against Apple JWKS.

### Devices & Push

- [ ] `POST /api/v1/devices/register`, `DELETE /api/v1/devices/:id`.
- [ ] `lib/notifications/push.ts` wrapping Expo Push API.
- [ ] Extend existing email notification triggers to also dispatch push via `notifyUser(userId, type, payload)`.
- [ ] `GET/PUT /api/v1/users/notification-preferences`.

### API hygiene

- [ ] Introduce `/api/v1/portal/*` variants: `projects`, `invoices`, `tickets` with **cursor pagination** `{ items, nextCursor }`.
- [ ] Standardise error envelope `{ error: { code, message, details? } }` across all `/api/v1/*`.
- [ ] Add `GET /api/health` and `GET /api/v1/config/app` (min supported version, maintenance flag, feature flags).
- [ ] Commit `docs/openapi.yaml` and CI job validating handlers match.
- [ ] Add CORS only for `capacitor://localhost` / `ionic://localhost` if Capacitor fallback is kept.

### Uploads

- [ ] Ensure `/api/admin/media` upload accepts multipart from mobile (test with `FormData` from RN).
- [ ] Server-side image resize on upload (store original + 480/1080 variants).
- [ ] Later: swap local FS to S3 and expose `POST /api/v1/media/presign` for direct upload.

### Real-time

- [ ] For tickets, add **SSE** endpoint `GET /api/v1/tickets/:id/stream` for live replies (or 30s polling for v1).
- [ ] Heartbeat every 25s; client reconnects with exponential backoff.

### Security

- [ ] Per-device rate limiting (IP + `X-Device-Id`).
- [ ] `X-App-Version` header required; reject < min version with `426 Upgrade Required`.
- [ ] Audit log `Device.registered`, `RefreshToken.rotated`, `RefreshToken.reuseDetected`.

### Payments

- [ ] `POST /api/v1/payments/initialize` returns `{ authorization_url, reference }`; mobile opens `WebBrowser.openAuthSessionAsync` and listens for deep link `mcaforo://payments/verify?reference=...`.
- [ ] Webhook route unchanged.

---

## 12. Recommended Tech Stack (Mobile)

### React Native + Expo (PRIMARY)

| Concern | Choice |
|---|---|
| Framework | Expo SDK 52+ (managed workflow; eject only if blocked) |
| Language | TypeScript (strict) |
| Navigation | React Navigation 7 — Stack + BottomTabs + linking |
| UI state | Zustand |
| Server state | TanStack Query v5 + persister (MMKV) |
| HTTP | Axios + custom interceptors |
| Styling | NativeWind (Tailwind for RN) — reuse `@mcaforo/ui-tokens` |
| Components | Custom primitives + `@gluestack-ui/themed` where useful |
| Forms | `react-hook-form` + `@hookform/resolvers/zod` + `@mcaforo/validators` |
| Secure storage | `expo-secure-store` |
| Cache storage | `react-native-mmkv` |
| Local DB (phase 2) | `expo-sqlite` + Drizzle ORM |
| Push | `expo-notifications` |
| Biometrics | `expo-local-authentication` |
| Deep links | `expo-linking` + React Navigation linking |
| Camera/media | `expo-image-picker`, `expo-camera`, `expo-file-system` |
| Haptics | `expo-haptics` |
| Crash | `@sentry/react-native` |
| Analytics | PostHog React Native |
| Testing | Jest + React Native Testing Library; Maestro for E2E |
| CI/CD | EAS Build + GitHub Actions; EAS Update for OTA |
| Distribution | TestFlight (iOS), Play Internal Testing (Android) |

### Flutter alternative (SECONDARY)

Only if the team decides to diverge from React. Stack: Dart 3.x, GoRouter, Riverpod, Dio, Drift, `flutter_secure_storage`, `firebase_messaging`, `local_auth`, `sentry_flutter`, Patrol for E2E, Fastlane + Codemagic.

---

## 13. Implementation Roadmap

### Phase 0 — Pre-Development (1–2 weeks)

- [ ] Apple Developer + Google Play accounts enrolled.
- [ ] Firebase project + FCM set up.
- [ ] Backend changes from §11 (auth tokens, devices, push, pagination, health, config, OpenAPI).
- [ ] Monorepo conversion: move existing repo into `apps/web`; extract `packages/{types,validators,api-client,utils,config,ui-tokens}`.
- [ ] `expo init apps/mobile` with TypeScript template; EAS configured.
- [ ] Brand assets: 1024×1024 icon, adaptive icon, splash.
- [ ] Sentry + PostHog projects.

### Phase 1 — Foundation & Auth (2–3 weeks)

- [ ] Navigation shell, theming, NativeWind wired to tokens.
- [ ] Axios client + refresh interceptor.
- [ ] SecureStore wrapper + `useAuth` Zustand store.
- [ ] Login, signup, verify-email (deep link), forgot/reset password.
- [ ] Google PKCE login; Apple Sign-In.
- [ ] Biometric opt-in + Face ID/fingerprint unlock.
- [ ] Logout flow (revoke + unregister device).
- [ ] Deep linking config + auth-aware route guard.

### Phase 2 — Core Features (4–6 weeks)

- [ ] Bottom tabs: Home, Projects, Invoices, Tickets, Account.
- [ ] Projects list + detail (pull-to-refresh, infinite scroll).
- [ ] Invoices list + detail + download PDF (`expo-file-system` + `expo-sharing`).
- [ ] Payments: `WebBrowser.openAuthSessionAsync` → deep link → verify status.
- [ ] Tickets: list, thread, reply, attach image (camera + library).
- [ ] Marketing surface: home, blog list + article (rendered from API; TipTap JSON → RN renderer).
- [ ] Push permission (after first invoice view, not on launch).
- [ ] Device registration + notification tap deep linking.
- [ ] Notification center screen + unread badge.

### Phase 3 — Polish (2 weeks)

- [ ] Skeleton loaders, empty states, error retry UI.
- [ ] Haptics on key actions.
- [ ] Connectivity banner + offline queue for tickets/profile.
- [ ] Dark mode (tokens already support it).
- [ ] Onboarding (3 slides).
- [ ] Rate-app prompt after 2nd successful invoice view.
- [ ] Accessibility pass: VoiceOver/TalkBack labels, 44×44 tap targets.
- [ ] Performance: `react-native-performance`, fix re-renders, list virtualisation.

### Phase 4 — QA (1–2 weeks)

- [ ] Jest unit tests for validators, formatters, auth interceptor.
- [ ] Integration tests for auth + push registration.
- [ ] Maestro flows: login → view invoice → pay → receive push → tap → deep link.
- [ ] Device matrix: iPhone SE (3rd gen), iPhone 15, Pixel 6a, Samsung A-series.
- [ ] Network throttling + airplane-mode tests.
- [ ] TestFlight internal (20 testers) + Play Closed Testing.

### Phase 5 — Launch (1–2 weeks)

- [ ] Production certificates + keystore.
- [ ] EAS production build, uploaded to TestFlight + Play internal.
- [ ] App Store Connect metadata (description, keywords, screenshots — all required device sizes).
- [ ] Play Console metadata + **Data Safety** section completed.
- [ ] Submit; Apple 1–3 days, Google 1–7 days.
- [ ] Google staged rollout 10% → 50% → 100%.
- [ ] Post-launch: Sentry + PostHog dashboards; plan v1.1.

---

## 14. Cost & Effort Estimate

McAforo mobile v1 is a **MEDIUM** app: ~20 screens (auth 6, marketing 4, portal 10+), push, camera upload, payments WebView, biometrics, partial offline.

| Team shape | Estimate (end-to-end) |
|---|---|
| Solo senior RN dev | **16–20 weeks** |
| 2 devs (1 RN + 1 backend) | **10–14 weeks** |
| 3 devs (2 RN + 1 backend) | **8–10 weeks** |

### Recurring costs (USD)

| Item | Cost |
|---|---|
| Apple Developer Program | $99 / year |
| Google Play Developer | $25 one-time |
| Firebase (FCM + Crashlytics) | Free (Spark) |
| Expo EAS Production | $29/mo (Priority $99/mo if needed) |
| Sentry | Free tier → $26/mo at scale |
| PostHog Cloud | Free → $0.00031/event |
| Expo Push | Free |

**Effort amplifiers** on this project: (a) payments WebView deep-link flow, (b) converting cookie-auth backend to bearer, (c) monorepo migration, (d) TipTap JSON → RN renderer for blog. Each adds ~3–5 dev-days.

---

## 15. Ten Immediate Next Steps (This Week)

1. **Enrol** Apple Developer ($99) + Google Play Developer ($25) accounts — both have multi-day identity verification.
2. **Create a Firebase project** `mcaforo-mobile`, enable Cloud Messaging, download service account JSON, and add it to Vercel env as `FIREBASE_ADMIN_JSON`.
3. **Branch `feat/mobile-api`** and add Prisma models `RefreshToken`, `Device`, `NotificationPreference`; run `prisma db push`.
4. **Ship `/api/v1/auth/login` + `/refresh` + `/logout`** returning bearer+refresh tokens; refactor `lib/auth.ts` → `resolveUser(req)` supporting both cookie and bearer.
5. **Add `GET /api/health` and `GET /api/v1/config/app`** — trivial but required for the mobile client from day one.
6. **Author `docs/openapi.yaml`** for at minimum: auth, devices, portal (projects, invoices, tickets), payments. Wire `openapi-typescript` in a new `packages/api-client`.
7. **Convert the repo to a Turborepo monorepo** (`apps/web` + `packages/{types,validators,utils,config,ui-tokens}`). Extract all Zod schemas into `packages/validators`.
8. **`pnpm create expo-app apps/mobile`** with TS; configure EAS (`eas init`), three build profiles (`development`, `preview`, `production`), and Sentry.
9. **Design the mobile-specific brand kit**: 1024×1024 icon, adaptive icon foreground, 2732×2732 splash, dark/light palette derived from `ui-tokens`.
10. **Lock the v1 scope** to **Auth + Portal (invoices, projects, tickets) + Push + Payments**. Explicitly defer the admin CMS, rich TipTap editing, and chatbot to v1.1 — this is the single biggest schedule risk.

---

*End of report.*
