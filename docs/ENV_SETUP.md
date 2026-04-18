# Environment Setup

All environment variables required by the McAforo CMS. Copy this to a
`.env` file at the project root (never commit it).

## Required

```bash
# --- Database ---
DATABASE_URL="postgresql://user:pass@localhost:5432/mcaforo"

# --- Auth (jose JWT) ---
AUTH_SECRET="replace-with-a-long-random-string-at-least-32-chars"

# --- Public site URL (used by sitemap, robots, OpenGraph, previews) ---
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## Recommended (production)

```bash
# --- CMS preview mode (Sprint 8) ---
# Used to sign short-lived preview tokens. Falls back to AUTH_SECRET
# if unset, which is fine for dev but should be distinct in prod.
CMS_PREVIEW_SECRET="another-long-random-string"

# --- Cron worker auth (Sprint 7) ---
# Hit GET /api/cron/scheduled-jobs?key=$CRON_SECRET every minute to
# process ScheduledJob rows (fallback path; pg-boss worker runs the
# same logic when available).
CRON_SECRET="another-long-random-string"

# --- Media storage root (Sprint 2) ---
# Where uploaded assets land on the filesystem. Default: ./public/uploads
CMS_MEDIA_ROOT="D:/xampp/htdocs/mcaforonew/public/uploads"
CMS_MEDIA_PUBLIC_PATH="/uploads"
```

## Optional integrations

```bash
# --- Email (Nodemailer) ---
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="McAforo <noreply@mcaforo.com>"

# --- Flutterwave (payments) ---
FLUTTERWAVE_PUBLIC_KEY=""
FLUTTERWAVE_SECRET_KEY=""
FLUTTERWAVE_WEBHOOK_HASH=""

# --- pg-boss (optional job queue backend) ---
# When set, Sprint 7 uses pg-boss for out-of-band scheduling in addition
# to the DB-backed fallback. When unset, the cron endpoint alone handles
# all scheduled jobs.
PG_BOSS_CONNECTION="postgresql://user:pass@localhost:5432/mcaforo"
```

## Setting up the cron worker

### Vercel Cron

Add to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/scheduled-jobs?key=REPLACE_WITH_CRON_SECRET", "schedule": "* * * * *" }
  ]
}
```

### Windows Task Scheduler (dev)

```powershell
# Create a task that hits the endpoint every minute
schtasks /create /tn "McAforo CMS Cron" /tr "powershell -Command \"Invoke-WebRequest -Uri http://localhost:3000/api/cron/scheduled-jobs?key=YOUR_SECRET\"" /sc minute /mo 1
```

### Linux/macOS cron

```bash
* * * * * curl -s "https://example.com/api/cron/scheduled-jobs?key=YOUR_SECRET" > /dev/null
```

### Uptime monitor (free, managed)

Any uptime monitor that hits a URL on a schedule works:
- UptimeRobot (5-minute minimum on free plan)
- Cronitor, EasyCron, cron-job.org (1-minute schedules available)

Point it at
`https://example.com/api/cron/scheduled-jobs?key=YOUR_SECRET`.

## Bootstrap sequence (fresh environment)

```bash
# 1. Install deps
npm install

# 2. Set up .env (copy this file, fill in values)

# 3. Apply schema
npx prisma migrate deploy   # prod
# or
npx prisma migrate dev      # dev

# 4. Generate client
npx prisma generate

# 5. Seed demo/baseline content
npx prisma db seed

# 6. One-time blog MDX → DB migration (if you have legacy MDX)
npx tsx scripts/migrate-mdx-to-db.ts

# 7. Build + start
npm run build
npm run start
```

## Secret rotation

All secrets (`AUTH_SECRET`, `CMS_PREVIEW_SECRET`, `CRON_SECRET`) are
consumed only at request time; rotate by updating `.env` and
restarting the server. Active sessions using `AUTH_SECRET` will
invalidate on rotation (users re-login).

API keys (`ApiKey` rows) are database-backed; revoke via the
`/admin/settings/api-keys` UI or by setting `revokedAt` on the row.
