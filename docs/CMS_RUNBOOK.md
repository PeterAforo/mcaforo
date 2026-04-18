# McAforo CMS — Operator Runbook

This document describes how to operate the full-fledged CMS introduced in
Sprints 1–12. It is intended for developers and ops engineers, not end
users.

## Architecture overview

```
┌───────────────────────┐
│   Next.js App Router  │
│  ┌─────────┐ ┌──────┐ │
│  │ /admin  │ │ /api │ │
│  └────┬────┘ └──┬───┘ │
│       │         │      │
│   ┌───▼─────────▼───┐  │
│   │   lib/cms/*     │  │  ← audit, crud, publish, seo, revisions,
│   │ shared helpers  │  │    webhooks, api-keys, rate-limit
│   └───┬─────────────┘  │
│       │                │
│   ┌───▼────┐    ┌────┐ │
│   │ Prisma │────│ PG │ │
│   └────────┘    └────┘ │
└───────────────────────┘
                 │
                 ├── pg-boss (optional) for scheduled jobs
                 └── /api/cron/scheduled-jobs (fallback)
```

### Data model (new in Sprints 2–9)

| Model | Purpose |
|---|---|
| `Page` | Generic CMS page with block-JSON content |
| `BlogPost` / `BlogCategory` | Blog, DB-backed (migrated from MDX in Sprint 5) |
| `MarketingService` / `MarketingProduct` | Homepage services & product cards |
| `Portfolio` / `CaseStudy` | Project showcases and detailed case studies |
| `TeamMember` / `Testimonial` / `FAQ` / `Value` / `ProcessStep` / `Stat` / `Partner` | Structured marketing building blocks |
| `Media` / `MediaFolder` | Uploaded assets with polymorphic usage tracking |
| `Menu` / `MenuItem` | Navigation trees (header/footer) |
| `SiteSettings` | Singleton: site name, SEO defaults, socials, GTM, favicon |
| `ContactSubmission` | Contact form inbox |
| `Redirect` | URL redirect table, consulted by Next.js middleware |
| `ScheduledJob` | Backing store for scheduled publish/unpublish |
| `Revision` | Polymorphic content snapshots (rollback) |
| `AuditLog` | Every admin/content mutation |
| `WebhookSubscription` / `WebhookDelivery` | Outbound event hooks |
| `ApiKey` | Hashed tokens for the public `/api/v1` API |

## Permissions

Permission matrix lives in `lib/auth/permissions.ts`.

- `ADMIN` — all
- `SUPPORT` — read-only content, full tickets/companies
- `PM` — full projects, read-only users
- `FINANCE` — full invoices/payments, read-only rest
- `CONTENT_EDITOR` — full CMS (pages, blog, all marketing content,
  media, menus, redirects, SEO settings); **no** user/finance access

Every admin API route calls `requireAdmin()` + `can(session, action, resource)`.

## Day-to-day operations

### Running migrations

```bash
npx prisma migrate dev   # dev
npx prisma migrate deploy # prod
npx prisma db seed
```

### Seeding marketing content

The `prisma/seed.ts` script populates all marketing resources
idempotently. Safe to re-run.

### Migrating legacy MDX blog posts

Once (after Sprint 5 migration is applied):

```bash
npx tsx scripts/migrate-mdx-to-db.ts
```

### Scheduled publishing

Two paths converge on the same outcome:

1. **pg-boss worker** — long-lived Node worker process (start with
   `node scripts/start-worker.js` when using Vercel Jobs or a dedicated
   dyno).
2. **HTTP cron fallback** — hit
   `GET /api/cron/scheduled-jobs?key=<CRON_SECRET>` every minute from
   Vercel Cron, Windows Task Scheduler, or any uptime monitor.

Both read from `ScheduledJob` rows where `status=PENDING` and
`runAt<=now`.

### Redirects

Edit in `/admin/redirects`. Changes trigger `revalidateTag('redirects')`,
so the `/api/internal/redirects-map` cache refreshes on the next hit.
The `middleware.ts` consults this map on every non-API request.

### Preview mode

1. Admin clicks **Preview** on a draft.
2. `POST /api/preview` issues a short-lived signed JWT.
3. Admin is sent to `GET /api/preview?token=…&redirect=/blog/foo`, which
   sets a `cms-preview` httpOnly cookie and redirects.
4. Public pages check `getPreviewContext()` and render draft content.

### Public API

```bash
curl -H 'Authorization: Bearer mca_...' https://example.com/api/v1/content/services
```

Create keys in `/admin/integrations/api-keys`. Plaintext is shown
**once** at creation — store it in a secrets manager.

### Webhooks

Subscribe to events via `WebhookSubscription`. Each POST includes:

- `X-McAforo-Signature: sha256=<hex>` — HMAC of body using the sub's secret
- `X-McAforo-Event: <event>`

Deliveries are logged in `WebhookDelivery` for debugging.

## Rollback procedure

1. Identify the bad commit: `git log`.
2. Revert schema (if applicable): `npx prisma migrate resolve --rolled-back`.
3. Restore content from Revisions via the admin UI, or SQL:
   ```sql
   UPDATE "Page" SET content = r.data
   FROM "Revision" r
   WHERE r."entityType" = 'Page' AND r.id = '<rev-id>' AND "Page".id = r."entityId";
   ```
4. `revalidateTag('pages')` by hitting the admin once.

## Observability

- `AuditLog` table — every admin action with before/after
- `WebhookDelivery` table — inspect failures
- `ScheduledJob` table — `lastError` for publish failures
- Server logs tagged `[audit]`, `[crud:<model>]`, `[publish]`, `[webhook]`

## Security notes

- All admin routes behind `requireAdmin()` + RBAC.
- Public API uses hashed API keys (sha256) — plaintext never stored.
- Webhooks signed with HMAC-SHA256.
- Rate-limited endpoints: `/api/contact` (5 / 10 min / IP).
- Preview cookies are httpOnly + signed JWT.
- `robots.noindexAll` flag in `SiteSettings` flips the site to blanket
  `Disallow: /` without a deploy.
