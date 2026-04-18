# CMS Architecture Report: McAforo

**Date:** 2026-04-17
**Approach:** Extend + restructure existing Next.js/Prisma stack. Full editorial suite. Local media, English only.

---

## 1. Project Analysis

| Aspect | Finding |
|---|---|
| **Project Type** | Hybrid marketing site + client portal + admin panel for a Ghana-based technology agency (McAforo). Services company selling web/mobile dev, automation, UI/UX, data analytics, cybersecurity, and managed IT, plus its own SaaS products (School/Church/Hospital/Farmer MS). |
| **Primary Audience** | **Site visitors:** SMEs and institutions in Ghana/Africa evaluating services. **CMS managers:** McAforo internal team — `ADMIN` (full), `PM` (projects), `SUPPORT` (tickets), `FINANCE` (billing), plus a new `CONTENT_EDITOR` role for the marketing team. |
| **Content Inventory** | Pages (home, about, services, products, projects, blog, case-studies, contact, privacy, terms) · BlogPosts · CaseStudies · Services (marketing) · Products · Projects/Portfolio · TeamMembers · Testimonials · FAQs · Values · ProcessSteps · Stats · Partners · Menus · SiteSettings · Redirects · ContactSubmissions · NewsletterSubscribers · Media. |
| **Content Relationships** | BlogPost → BlogCategory (many-to-one) + tags (string array) · Service → Plans → AddOns (already exist) · Project (portfolio) → Services (many-to-many) · CaseStudy → Service + Industry · Page → PageSections → Block types · Testimonial → optional Project/Service link · Media → any entity via polymorphic `MediaUsage`. |
| **Media Requirements** | Images (JPEG/PNG/WebP/SVG), PDFs (case study downloads, brand docs), MP4/WebM for product demos. No 3D/audio. Local filesystem per your decision. |
| **Multilingual Needs** | English only for v1 (confirmed). Schema reserves `locale` field for future extension but not exposed in UI. |
| **User Roles** | Existing: `ADMIN, PM, SUPPORT, FINANCE, CLIENT_ADMIN, CLIENT_USER`. **Adding:** `CONTENT_EDITOR` (marketing team — manages all public content, cannot touch billing/users/portal). |
| **Technical Environment** | Next.js 16 App Router, React 18, Prisma 5, PostgreSQL, TailwindCSS, Radix/shadcn UI, `jose` JWT auth, Nodemailer, framer-motion, MDX tooling (to be deprecated in favor of DB). Windows dev via XAMPP, production target presumed Vercel/VPS. |
| **Integrations** | `IntegrationProvider` abstraction already present. Active/planned: Flutterwave (payments, already in `Transaction` model), SMTP/SendGrid (notifications), mNotify/Twilio (SMS), newsletter double opt-in. New: webhook delivery system for publish events. |
| **Traffic & Scale** | SMB scale. Estimated <50k visitors/month year-one. Single Postgres instance fine. Admin concurrent users <10. Editorial write load trivial. |

---

## 2. CMS Proposal

### 2.1 Architecture Recommendation

**Hybrid CMS, single Next.js monolith.** Admin panel and public site share one Next.js app, one Postgres DB, one Prisma client. Public pages render via React Server Components with direct DB reads (zero API hop); admin uses Next.js Route Handlers (`app/api/admin/*`) for mutations. An optional public REST layer (`app/api/v1/*`) is exposed for future mobile/external consumers.

**Justification:**
- **Reuses existing infrastructure:** Portal, auth (`jose` JWT), `AuditLog`, `IntegrationProvider`, `NotificationLog`, role system — all already production-grade. A headless replacement would throw this away.
- **Server Components eliminate the API layer** for public reads, which is the dominant traffic pattern. Admin mutations stay API-driven for predictable validation/audit trail.
- **Single deploy unit** matches team size. Splitting into a dedicated CMS service would add ops overhead without compensating benefit at SMB scale.

### 2.2 Technology Stack

| Layer | Choice | Justification |
|---|---|---|
| **Runtime/Framework** | Next.js 16 (App Router) | Already in use. RSC + Server Actions reduce CMS boilerplate by ~40%. |
| **Language** | TypeScript 5.3 | Already in use. Schema-to-type safety with Prisma + Zod. |
| **Database** | PostgreSQL 15+ | Already in use. JSONB for `dataJson` block payloads; full-text search via `tsvector`. |
| **ORM** | Prisma 5 | Already in use. Migration-first. |
| **Validation** | Zod 3 | Already in use. One schema serves API + client form + Prisma payload shape. |
| **Admin UI** | Existing shadcn/ui + Radix primitives | Already in use. Build custom screens in `app/admin/*`. Avoids adding AdminJS/React-Admin (which would fight the existing aesthetic). |
| **Rich Text Editor** | **TipTap 2** (StarterKit + Image + Link + Table + CodeBlockLowlight + Placeholder extensions) | Headless, React-first, ProseMirror-based, emits clean JSON (stored in Postgres JSONB — diffable for version history). Alternatives considered: Lexical (newer, less mature), Quill (DOM-coupled, bad for SSR). |
| **API Layer** | Next.js Route Handlers + Server Actions. REST v1 for public reads. | Admin uses Server Actions (type-safe, form-native). Public uses Route Handlers for caching control. No GraphQL — overkill. |
| **Authentication** | Existing `jose`-based JWT in httpOnly cookies | Already in use. Add CSRF double-submit token for state-changing admin routes. |
| **Media Storage** | Local filesystem at `public/uploads/{yyyy}/{mm}/{uuid}.{ext}` + `sharp` for resize/WebP conversion | Per your decision. `sharp` generates `thumb (320w)`, `sm (640w)`, `md (1200w)`, `lg (1920w)` variants on upload. Served via Next.js `<Image>`. |
| **Background Jobs** | `pg-boss` (Postgres-backed queue) | No Redis needed. Handles scheduled publishing, webhook delivery retries, newsletter batches, recurring invoice issuance (already planned). Alternative: BullMQ (needs Redis). |
| **Search** | Postgres `tsvector` + GIN index | Zero external dependency. Sufficient for <100k entries. Upgrade to MeiliSearch only if needed. |
| **Caching** | Next.js `revalidateTag()` + `unstable_cache()` | Tags per content type. Publish/update actions call `revalidateTag('blog')` etc. |
| **Hosting** | Vercel (recommended) or VPS with Node 20 + systemd + nginx | Vercel gives zero-config CDN; VPS required if local `public/uploads` must be persistent (Vercel is ephemeral — **see §4.5 deployment note**). |
| **Logging** | Existing `AuditLog` + server console → future Pino | Extend `AuditLog` to cover all CMS mutations. |

### 2.3 Content Model

| Content Type | Key Fields | Relationships | Notes |
|---|---|---|---|
| **Page** (existing, extend) | slug, title, sections[], status, publishedAt, seoTitle, seoDescription, ogImage, canonicalUrl, version | → PageSection[], Revision[] | Block-based via typed sections |
| **PageSection** (existing, refactor) | pageId, blockType (enum), data (JSONB), order | → Page | `blockType` constrains `data` via Zod schema per block |
| **BlogPost** (existing, extend) | slug, title, excerpt, content (TipTap JSON), featuredImage, author, category, tags, status, publishedAt, scheduledAt, version | → BlogCategory, Revision[] | Migrate from MDX |
| **BlogCategory** (existing) | name, slug, description | → BlogPost[] | |
| **CaseStudy** (new) | slug, title, client, industry, summary, content, heroImage, gallery[], services[], results (JSONB: metrics), publishedAt, status | → MarketingService[], MarketingProject?, Revision[] | Migrate from MDX |
| **MarketingService** (new) | slug, title, description, icon (lucide name), featuredImage, body, features[], pricingNote, order, isActive | → CaseStudy[] | Differs from billing `Service`; namespace avoids clash |
| **MarketingProduct** (new) | slug, title, tagline, description, icon, heroImage, screenshots[], features[], modules[] (JSONB), demoUrl, order | — | School/Church/Hospital/Farmer MS |
| **Portfolio** (new) | slug, client, title, description, heroImage, gallery[], services[], results[] (JSONB), year, isFeatured, order | → MarketingService[] | |
| **TeamMember** (new) | name, slug, role, bio, photo, socials (JSONB: linkedin/twitter/github), order, isActive | — | |
| **Testimonial** (new) | authorName, authorRole, authorCompany, authorPhoto, quote, rating, projectId?, serviceId?, isFeatured, order | → Portfolio?, MarketingService? | |
| **FAQ** (new) | question, answer (rich), category, order, isActive | — | |
| **Value** (new) | title, description, icon, order | — | About page values |
| **ProcessStep** (new) | step, title, description, icon, order | — | |
| **Stat** (new) | label, value, suffix, icon, order | — | E.g. "5+ Years" |
| **Partner** (new) | name, logo, url, order, isActive | — | Client/partner logos |
| **Menu** (existing) | name, location, items[] | → MenuItem[] | |
| **MenuItem** (existing) | label, url, icon, parentId, order | → Menu, parent/children | |
| **SiteSettings** (new, singleton) | siteName, tagline, contactEmail, contactPhone, address, socials (JSONB), logo, favicon, ogDefaultImage, footerHtml, gtmId, noindex | — | Single-row table keyed by `id = 'singleton'` |
| **Redirect** (new) | source, destination, statusCode (301/302), isActive, hits, lastHitAt | — | Middleware-consumed |
| **ContactSubmission** (new) | name, email, phone, company, service, message, status (new/read/replied/archived), ipAddress, userAgent | — | Form dest + admin inbox |
| **Media** (new) | filename, mimeType, size, width, height, altText, caption, folderId, variants (JSONB: {thumb, sm, md, lg}), uploadedById, hash | → MediaFolder?, User, MediaUsage[] | |
| **MediaFolder** (new) | name, slug, parentId, path | parent/children | |
| **MediaUsage** (new) | mediaId, entityType, entityId, field | → Media | Tracks which content references each asset (prevents orphan delete) |
| **Revision** (new) | entityType, entityId, data (JSONB snapshot), authorId, message, createdAt | → User | Polymorphic history for Page/BlogPost/CaseStudy |
| **ScheduledJob** (new) | entityType, entityId, action (publish/unpublish), runAt, status, attempts, lastError | — | Consumed by pg-boss worker |
| **Webhook** (new) | name, targetUrl, secret, events[] (content.published, content.updated, media.uploaded, etc.), isActive, createdAt | → WebhookDelivery[] | |
| **WebhookDelivery** (new) | webhookId, event, payload, responseStatus, responseBody, attempt, deliveredAt, error | → Webhook | |
| **NewsletterSubscriber** (existing) | email, isConfirmed, confirmToken, unsubscribeToken | — | |

### 2.4 Roles & Permissions

| Role | Content CRUD | Publish | Media | Users | Roles | Integrations | Settings | Billing/Portal |
|---|---|---|---|---|---|---|---|---|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CONTENT_EDITOR** (new) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | partial (SiteSettings) | ❌ |
| **PM** | read-only marketing | ❌ | read-only | ❌ | ❌ | ❌ | ❌ | projects/milestones ✅ |
| **SUPPORT** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | tickets ✅ |
| **FINANCE** | ❌ | ❌ | ❌ | ❌ | ❌ | payment providers ✅ | ❌ | invoices/payments ✅ |
| **CLIENT_ADMIN** | ❌ | ❌ | ❌ | own company | ❌ | ❌ | ❌ | own company ✅ |
| **CLIENT_USER** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | own tickets/invoices ✅ |

Enforcement via a single `can(user, action, resource)` utility in `@/lib/auth/permissions.ts`, called in every Server Action and Route Handler.

### 2.5 Features List

**Content Management** — Block-based page builder · TipTap rich editor · slug auto-gen + manual override · draft/published/scheduled · featured image picker · SEO per entry · category/tag · reorderable sections · duplicate entry · bulk actions · import from MDX (one-time migration).

**Media Management** — Drag-drop upload · auto WebP + 4 responsive variants via `sharp` · folder tree · alt text / caption required on images · usage tracker (prevent orphan delete) · search by filename/alt · replace-in-place.

**Editorial Workflow** — Revisions with diff viewer + one-click rollback · scheduled publishing (pg-boss) · preview mode (draft URL with signed token) · activity feed per entry · comments/notes on drafts.

**SEO Tools** — Per-entry meta fields · SERP + OG preview cards · character-count warnings · auto-sitemap (`/sitemap.xml`) · robots.txt editor · canonical URL override · noindex per page · auto JSON-LD (Article/Product/Organization) · redirect manager.

**User & Role Management** — Extend existing `UserRole` to include `CONTENT_EDITOR` · invite flow already exists · per-role permission matrix enforced server-side.

**API & Integrations** — Public REST v1 (`/api/v1/*`) for pages, posts, case studies, services, products, projects, team, testimonials, FAQs, site-settings · webhooks on publish/update/delete · ISR/revalidation tags triggered from admin.

**Performance & Caching** — `unstable_cache` per content type tagged with `revalidateTag` · image CDN via Next.js Image Optimization · Postgres GIN indexes for search · published-only view via DB partial indexes.

**Security** — JWT httpOnly cookies · CSRF double-submit · Zod input validation · HTML sanitization (`isomorphic-dompurify`) on rich-text render · file-type + magic-byte validation on uploads · rate limiting on auth + contact form · audit log on every mutation · secrets in env only.

**Developer Tools** — Admin API docs auto-generated from Zod schemas (`zod-to-openapi`) · Prisma Studio for emergency data edits · seed script for demo content · MDX-to-DB migration CLI.

---

## 3. Technical Plan

### 3.1 System Architecture

```
                           ┌─────────────────────────────┐
  Visitor ─── HTTP ───────▶│  Next.js Public (RSC)       │
                           │  app/(marketing)/* + /(blog)│
                           │  reads Prisma directly      │
                           │  unstable_cache + tags      │
                           └─────────────┬───────────────┘
                                         │
                                         ▼
  Editor ─── HTTP ──▶┌──────────────┐  Prisma Client  ┌───────────────┐
                     │ Next.js      │◀───────────────▶│ PostgreSQL    │
                     │ Admin        │                 │ + tsvector    │
                     │ app/admin/*  │                 │ + JSONB       │
                     │ Server       │                 └───────────────┘
                     │ Actions      │                          ▲
                     └──────┬───────┘                          │
                            │                                  │
              ┌─────────────┼─────────────┐                    │
              ▼             ▼             ▼                    │
       AuditLog       revalidateTag  pg-boss queue ────────────┘
                                          │
                                          ▼
                    ┌─────────────┬──────────────┬─────────────────┐
                    │ Publish job │ Webhook job  │ Media variants  │
                    └─────────────┴──────┬───────┴─────────────────┘
                                         ▼
                                  POST webhook targets

  Upload ──▶ POST /api/admin/media/upload
              │
              ├─▶ sharp → variants → public/uploads/{yyyy}/{mm}/{uuid}-{variant}.webp
              └─▶ Media row + MediaUsage when referenced
```

**Auth:** JWT in httpOnly `session` cookie signed by `jose`. Middleware in `middleware.ts` verifies + refreshes token, attaches `userId` + `roles[]` to request context. CSRF token issued on login, validated on all `POST/PUT/PATCH/DELETE /api/admin/*`.

**Events:** Every publish/update/delete fires a local event that (a) writes `AuditLog`, (b) calls `revalidateTag(contentType)`, (c) enqueues `WebhookDelivery` rows for each matching `Webhook`.

### 3.2 Data Schema (new/changed Prisma models)

```prisma
// === Roles extension ===
enum RoleName {
  CLIENT_USER
  CLIENT_ADMIN
  SUPPORT
  PM
  FINANCE
  CONTENT_EDITOR   // NEW
  ADMIN
}

enum ContentStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  ARCHIVED
}

// === Media ===
model Media {
  id           String   @id @default(cuid())
  filename     String
  originalName String
  mimeType     String
  size         Int
  width        Int?
  height       Int?
  altText      String?
  caption      String?
  folderId     String?
  variants     Json?    // { thumb: "/uploads/../file-320.webp", sm, md, lg }
  hash         String   @unique   // sha256 for dedupe
  uploadedById String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  folder     MediaFolder?  @relation(fields: [folderId], references: [id])
  uploadedBy User          @relation(fields: [uploadedById], references: [id])
  usages     MediaUsage[]

  @@index([folderId])
  @@index([mimeType])
}

model MediaFolder {
  id        String   @id @default(cuid())
  name      String
  slug      String
  parentId  String?
  path      String   // denormalized "/marketing/blog" for fast browse
  createdAt DateTime @default(now())

  parent   MediaFolder?  @relation("FolderTree", fields: [parentId], references: [id])
  children MediaFolder[] @relation("FolderTree")
  media    Media[]

  @@unique([parentId, slug])
  @@index([path])
}

model MediaUsage {
  id         String   @id @default(cuid())
  mediaId    String
  entityType String   // "Page", "BlogPost", "CaseStudy", ...
  entityId   String
  field      String   // "featuredImage", "gallery[2]", "sections[hero].bgImage"
  createdAt  DateTime @default(now())

  media Media @relation(fields: [mediaId], references: [id], onDelete: Cascade)

  @@index([mediaId])
  @@index([entityType, entityId])
}

// === Revisions (polymorphic) ===
model Revision {
  id         String   @id @default(cuid())
  entityType String   // "Page" | "BlogPost" | "CaseStudy"
  entityId   String
  data       Json     // full snapshot of the entity at save time
  message    String?  // optional commit-style note
  authorId   String
  createdAt  DateTime @default(now())

  author User @relation(fields: [authorId], references: [id])

  @@index([entityType, entityId, createdAt])
}

// === Page (refactor) ===
model Page {
  id              String        @id @default(cuid())
  slug            String        @unique
  title           String
  excerpt         String?
  metaTitle       String?
  metaDescription String?
  ogImage         String?
  canonicalUrl    String?
  noindex         Boolean       @default(false)
  status          ContentStatus @default(DRAFT)
  scheduledAt     DateTime?
  publishedAt     DateTime?
  version         Int           @default(1)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  sections PageSection[]

  @@index([slug])
  @@index([status])
}

model PageSection {
  id        String   @id @default(cuid())
  pageId    String
  blockType String   // "hero" | "featureGrid" | "richText" | "testimonials" | "cta" | "faq" | "stats" | "gallery" | "teamGrid" | "productsGrid" | "servicesGrid" | "caseStudyCarousel" | "contactForm" | "newsletter"
  data      Json     // validated per blockType via Zod at write time
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  page Page @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId, order])
}

// === BlogPost (extend) ===
model BlogPost {
  id              String        @id @default(cuid())
  slug            String        @unique
  title           String
  excerpt         String?
  content         Json          // TipTap JSON doc
  contentHtml     String?       @db.Text   // cached render
  featuredImage   String?
  authorId        String?
  categoryId      String?
  tags            String[]
  metaTitle       String?
  metaDescription String?
  ogImage         String?
  status          ContentStatus @default(DRAFT)
  scheduledAt     DateTime?
  publishedAt     DateTime?
  version         Int           @default(1)
  views           Int           @default(0)
  searchVector    Unsupported("tsvector")?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  category BlogCategory? @relation(fields: [categoryId], references: [id])
  author   User?         @relation("BlogAuthor", fields: [authorId], references: [id])

  @@index([slug])
  @@index([status, publishedAt])
  @@index([categoryId])
}

// === CaseStudy ===
model CaseStudy {
  id              String        @id @default(cuid())
  slug            String        @unique
  title           String
  client          String
  industry        String?
  summary         String
  content         Json          // TipTap JSON
  heroImage       String?
  gallery         String[]      // media IDs
  results         Json?         // [{ label, value, suffix }]
  year            Int?
  isFeatured      Boolean       @default(false)
  order           Int           @default(0)
  metaTitle       String?
  metaDescription String?
  status          ContentStatus @default(DRAFT)
  scheduledAt     DateTime?
  publishedAt     DateTime?
  version         Int           @default(1)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  services MarketingServiceOnCaseStudy[]
  @@index([slug])
  @@index([status])
}

// === MarketingService (distinct from billing Service) ===
model MarketingService {
  id             String    @id @default(cuid())
  slug           String    @unique
  title          String
  description    String
  icon           String    // lucide-react icon name
  featuredImage  String?
  body           Json?     // TipTap JSON for service detail page
  features       String[]
  pricingNote    String?
  order          Int       @default(0)
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  caseStudies MarketingServiceOnCaseStudy[]
  portfolios  MarketingServiceOnPortfolio[]
  testimonials Testimonial[]

  @@index([slug])
}

model MarketingServiceOnCaseStudy {
  serviceId   String
  caseStudyId String
  service    MarketingService @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  caseStudy  CaseStudy        @relation(fields: [caseStudyId], references: [id], onDelete: Cascade)
  @@id([serviceId, caseStudyId])
}

// === MarketingProduct ===
model MarketingProduct {
  id           String   @id @default(cuid())
  slug         String   @unique
  title        String
  tagline      String?
  description  String
  icon         String
  heroImage    String?
  screenshots  String[]
  features     String[]
  modules      Json?    // [{ name, description, icon }]
  demoUrl      String?
  order        Int      @default(0)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([slug])
}

// === Portfolio ===
model Portfolio {
  id          String   @id @default(cuid())
  slug        String   @unique
  client      String
  title       String
  description String
  heroImage   String?
  gallery     String[]
  results     Json?    // [{ label, value }]
  year        Int?
  isFeatured  Boolean  @default(false)
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  services     MarketingServiceOnPortfolio[]
  testimonials Testimonial[]

  @@index([slug])
}

model MarketingServiceOnPortfolio {
  serviceId   String
  portfolioId String
  service   MarketingService @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  portfolio Portfolio        @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  @@id([serviceId, portfolioId])
}

// === TeamMember ===
model TeamMember {
  id        String   @id @default(cuid())
  slug      String   @unique
  name      String
  role      String
  bio       String?
  photo     String?
  socials   Json?    // { linkedin, twitter, github, email }
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// === Testimonial ===
model Testimonial {
  id            String   @id @default(cuid())
  authorName    String
  authorRole    String?
  authorCompany String?
  authorPhoto   String?
  quote         String
  rating        Int?     // 1-5
  portfolioId   String?
  serviceId     String?
  isFeatured    Boolean  @default(false)
  order         Int      @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  portfolio Portfolio?        @relation(fields: [portfolioId], references: [id])
  service   MarketingService? @relation(fields: [serviceId], references: [id])
}

// === FAQ / Value / ProcessStep / Stat / Partner ===
model FAQ {
  id        String   @id @default(cuid())
  question  String
  answer    Json     // TipTap
  category  String?
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Value {
  id          String  @id @default(cuid())
  title       String
  description String
  icon        String
  order       Int     @default(0)
  isActive    Boolean @default(true)
}

model ProcessStep {
  id          String  @id @default(cuid())
  step        Int
  title       String
  description String
  icon        String
  order       Int     @default(0)
  isActive    Boolean @default(true)
}

model Stat {
  id     String  @id @default(cuid())
  label  String
  value  String  // "5", "10k", "99.9"
  suffix String? // "+", "%"
  icon   String?
  order  Int     @default(0)
  isActive Boolean @default(true)
}

model Partner {
  id        String  @id @default(cuid())
  name      String
  logo      String
  url       String?
  order     Int     @default(0)
  isActive  Boolean @default(true)
}

// === SiteSettings (singleton) ===
model SiteSettings {
  id               String  @id @default("singleton")
  siteName         String
  tagline          String?
  contactEmail     String
  contactPhone     String?
  address          String?
  socials          Json?   // { linkedin, twitter, facebook, instagram, youtube }
  logo             String?
  logoDark         String?
  favicon          String?
  ogDefaultImage   String?
  footerHtml       String?
  gtmId            String?
  gaMeasurementId  String?
  noindexAll       Boolean @default(false)
  updatedAt        DateTime @updatedAt
}

// === Redirects ===
model Redirect {
  id          String   @id @default(cuid())
  source      String   @unique
  destination String
  statusCode  Int      @default(301)
  isActive    Boolean  @default(true)
  hits        Int      @default(0)
  lastHitAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([source])
}

// === ContactSubmission ===
enum ContactStatus {
  NEW
  READ
  REPLIED
  ARCHIVED
  SPAM
}

model ContactSubmission {
  id        String        @id @default(cuid())
  name      String
  email     String
  phone     String?
  company   String?
  service   String?
  message   String
  status    ContactStatus @default(NEW)
  ipAddress String?
  userAgent String?
  createdAt DateTime      @default(now())

  @@index([status, createdAt])
}

// === Scheduling & Webhooks ===
enum ScheduledAction {
  PUBLISH
  UNPUBLISH
}

model ScheduledJob {
  id          String          @id @default(cuid())
  entityType  String
  entityId    String
  action      ScheduledAction
  runAt       DateTime
  status      String          @default("pending") // pending|done|failed|cancelled
  attempts    Int             @default(0)
  lastError   String?
  createdAt   DateTime        @default(now())

  @@index([status, runAt])
}

model Webhook {
  id         String   @id @default(cuid())
  name       String
  targetUrl  String
  secret     String
  events     String[] // "content.published", "content.updated", "content.deleted", "media.uploaded"
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  deliveries WebhookDelivery[]
}

model WebhookDelivery {
  id             String   @id @default(cuid())
  webhookId      String
  event          String
  payload        Json
  responseStatus Int?
  responseBody   String?
  attempt        Int      @default(1)
  deliveredAt    DateTime?
  error          String?
  createdAt      DateTime @default(now())

  webhook Webhook @relation(fields: [webhookId], references: [id], onDelete: Cascade)

  @@index([webhookId, createdAt])
}
```

### 3.3 API Design

**Public REST (unauthenticated, published-only, cached):**

```
GET /api/v1/pages/:slug
GET /api/v1/blog?category=&tag=&page=&limit=
GET /api/v1/blog/:slug
GET /api/v1/case-studies?service=&industry=
GET /api/v1/case-studies/:slug
GET /api/v1/services
GET /api/v1/services/:slug
GET /api/v1/products
GET /api/v1/products/:slug
GET /api/v1/portfolio?service=&year=
GET /api/v1/portfolio/:slug
GET /api/v1/team
GET /api/v1/testimonials?featured=true
GET /api/v1/faqs?category=
GET /api/v1/site-settings
GET /api/v1/menus/:location
GET /sitemap.xml
GET /robots.txt
```

All responses `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400` and tagged for `revalidateTag`.

**Admin (JWT + CSRF, role-gated) — implemented via Server Actions and Route Handlers:**

```
# Content (pattern applies to: pages, blog-posts, case-studies, services,
# products, portfolio, team, testimonials, faqs, values, process-steps,
# stats, partners)
GET    /api/admin/{resource}                 list (all statuses, filters)
POST   /api/admin/{resource}                 create
GET    /api/admin/{resource}/:id             read
PATCH  /api/admin/{resource}/:id             update
DELETE /api/admin/{resource}/:id             delete
POST   /api/admin/{resource}/:id/publish     publish now
POST   /api/admin/{resource}/:id/unpublish
POST   /api/admin/{resource}/:id/schedule    body: { runAt, action }
POST   /api/admin/{resource}/:id/duplicate
GET    /api/admin/{resource}/:id/revisions
GET    /api/admin/{resource}/:id/revisions/:revId
POST   /api/admin/{resource}/:id/revisions/:revId/restore
GET    /api/admin/{resource}/:id/preview-token        returns signed URL

# Media
POST   /api/admin/media/upload                multipart; returns Media + variants
GET    /api/admin/media                       ?folder=&search=&mime=
PATCH  /api/admin/media/:id                   update altText/caption/folder
DELETE /api/admin/media/:id                   blocks if MediaUsage exists unless force=true
GET    /api/admin/media/:id/usages
POST   /api/admin/media/folders
PATCH  /api/admin/media/folders/:id
DELETE /api/admin/media/folders/:id

# Menus
GET    /api/admin/menus
POST   /api/admin/menus
PATCH  /api/admin/menus/:id
POST   /api/admin/menus/:id/reorder           body: [{ id, order, parentId }]

# Site settings (singleton)
GET    /api/admin/site-settings
PATCH  /api/admin/site-settings

# Redirects
GET    /api/admin/redirects
POST   /api/admin/redirects
PATCH  /api/admin/redirects/:id
DELETE /api/admin/redirects/:id

# Contact submissions
GET    /api/admin/contact-submissions
PATCH  /api/admin/contact-submissions/:id     update status

# Webhooks
GET    /api/admin/webhooks
POST   /api/admin/webhooks
PATCH  /api/admin/webhooks/:id
DELETE /api/admin/webhooks/:id
POST   /api/admin/webhooks/:id/test
GET    /api/admin/webhooks/:id/deliveries

# Search
GET    /api/admin/search?q=&type=

# Activity / audit
GET    /api/admin/activity?entityType=&entityId=&userId=

# Preview (public, token-gated)
GET    /api/preview?token=&type=&id=          sets preview cookie, redirects to content URL
POST   /api/preview/exit

# Auth (existing, unchanged)
POST   /api/admin/auth/login
POST   /api/admin/auth/logout
GET    /api/admin/auth/me
POST   /api/admin/auth/refresh

# Public (forms)
POST   /api/contact                           rate-limited 5/min/IP
POST   /api/newsletter/subscribe              double opt-in
GET    /api/newsletter/confirm?token=
POST   /api/newsletter/unsubscribe?token=
```

### 3.4 Admin UI Screen Map

```
/admin
├── / (Dashboard)
│   └── Widgets: recent content, pending scheduled jobs, contact submissions,
│                webhook failures, top pages (by views), draft count
├── /content
│   ├── /pages                  (list, search, filter by status)
│   │   └── /pages/:id/edit     (block builder + SEO tab + Revisions tab + Preview btn)
│   ├── /blog                   (existing, refactor to match)
│   │   ├── /blog/posts
│   │   ├── /blog/categories
│   │   └── /blog/posts/:id/edit
│   ├── /case-studies
│   ├── /services               (marketing)
│   ├── /products               (marketing)
│   ├── /portfolio
│   ├── /team
│   ├── /testimonials
│   ├── /faqs
│   └── /site-structure         (Values, ProcessSteps, Stats, Partners — small tables)
├── /media
│   ├── /                        (grid, folder tree sidebar, filters)
│   ├── /folders
│   └── /:id                    (detail, alt/caption edit, usages list)
├── /cms
│   ├── /menus                   (existing, add reorderable tree UI)
│   ├── /redirects
│   ├── /contact-submissions     (inbox)
│   └── /webhooks
│       └── /:id/deliveries
├── /settings
│   ├── /site                    (SiteSettings form)
│   ├── /seo                     (sitemap status, robots.txt editor)
│   ├── /integrations            (existing IntegrationProvider UI)
│   ├── /users
│   ├── /roles
│   └── /api-tokens
└── /activity                    (AuditLog viewer with filters)
```

**Editor UX specifics:**
- List views: `<DataTable>` built on shadcn `Table` with column-sort, column-filter, pagination, bulk select, status-badge column, row-actions dropdown (edit/duplicate/delete/publish).
- Edit views: two-column layout — main form left, sidebar right (Status · Visibility · Schedule · SEO · Featured image · Categories/Tags · Revisions button).
- Page/BlogPost/CaseStudy editors have tabs: **Content · SEO · Revisions · Settings**.
- Autosave every 3s of inactivity → creates `Revision` row if diff > noise threshold.
- "Publish" button → if `scheduledAt` set, creates `ScheduledJob`, else sets `status = PUBLISHED`, `publishedAt = now()`, fires `content.published` webhook, calls `revalidateTag`.

### 3.5 Feature Specifications

**Rich Text Editor (TipTap)**
- Extensions: `StarterKit`, `Link`, `Image` (opens Media picker), `Table`, `TableRow`, `TableCell`, `CodeBlockLowlight`, `Placeholder`, `Highlight`, `Underline`, `TaskList`, `TaskItem`, `Youtube` (embed).
- Toolbar: H1–H4, Bold, Italic, Underline, Strike, Code, Blockquote, Link, Image, Table, Bullet/Ordered/Task list, Align, Code block, HR, YouTube, Clear formatting.
- Storage: TipTap JSON in `content` (JSONB). Rendered-HTML cached in `contentHtml` on save, sanitized via `isomorphic-dompurify` with allowlist.
- Media picker: opens Media library modal, inserts via `Media.variants.md` URL + `alt`.

**Block Builder (Pages)**
- Typed block catalogue defined in `@/lib/cms/blocks/`. Each block exports: `schema` (Zod), `defaults`, `adminForm` (React), `render` (React Server Component).
- Admin page edit view shows a vertical list of section cards with drag-reorder, inline edit, delete, duplicate, "add block below" picker.
- On save, each `PageSection.data` is validated against the matching Zod schema. Invalid data blocks the save with field-level errors.
- Public render iterates `page.sections` by order and calls the matching `render()` — no switch in page code.

**Slug Management**
- On create: slugify title → check uniqueness per content-type → suffix `-2`, `-3` if collision.
- On title change: **do not** auto-change slug once content is published; admin sees "Update slug?" prompt. If accepted, automatically create `Redirect(oldSlug → newSlug, 301)`.
- Manual edit allowed by editors with role `ADMIN | CONTENT_EDITOR`.

**Version History (Revisions)**
- Trigger: every successful save of Page/BlogPost/CaseStudy creates a `Revision` row snapshotting the full entity (incl. sections for Page).
- Deduping: if consecutive snapshots by same author within 60s have only whitespace diff, the latest overwrites (no new row).
- UI: Revisions tab shows list (author, timestamp, message). Click opens side-by-side diff (text-diff for strings, JSON diff for structured). "Restore" button creates a new revision from the old snapshot.
- Retention: keep last 50 revisions per entity; older auto-pruned weekly.

**SEO Module**
- Per-entry fields: `metaTitle` (<=60), `metaDescription` (<=160), `ogImage`, `canonicalUrl`, `noindex`.
- Live character-count with warning at 80% and red at 100%.
- SERP preview (Google card) and OG preview (Twitter + Facebook) rendered client-side from current form values.
- `/sitemap.xml` route: reads all `status=PUBLISHED` content from relevant models + site-settings-driven static routes; `lastmod = updatedAt`; cached 1h.
- `/robots.txt` route: reads `SiteSettings.noindexAll` (if true emits `Disallow: /`), plus editor-provided extra rules; always includes `Sitemap:` line.
- Auto JSON-LD: `Article` for BlogPost, `Organization` + `WebSite` for homepage, `Product` for MarketingProduct, `FAQPage` for FAQ sections, `BreadcrumbList` everywhere.

**Scheduled Publishing**
- Admin sets `scheduledAt` + action (publish/unpublish). Server Action creates `ScheduledJob(status=pending, runAt=scheduledAt)` and sets entity `status=SCHEDULED`.
- `pg-boss` worker runs every 60s, claims due jobs with `SELECT … FOR UPDATE SKIP LOCKED`, executes action, marks job done, fires webhook, revalidates cache. On failure: increment `attempts`, retry with exponential backoff up to 5 times.
- Notification: on failure, email + in-app notification to `authorId`.

**Media Manager**
- Upload pipeline: multipart → validate mime + magic-bytes (`file-type`) → compute sha256 → check dedupe by hash → write original → `sharp` generates `thumb (320w)`, `sm (640w)`, `md (1200w)`, `lg (1920w)` as WebP → write `Media` row with `variants`.
- Max size: 20MB images, 100MB video, 50MB docs. Configurable in `SiteSettings`.
- Folder tree UI with drag-move; `path` denormalized for fast queries.
- Alt text required on images before use in published content (validator at entity publish time, not upload).
- "Usages" tab on Media detail lists every referenced entity; delete blocked if usages exist (force flag available to ADMIN only).

**Search & Filtering (Admin)**
- Postgres `tsvector` column on BlogPost, CaseStudy, Page (title + content + excerpt, weighted `A/B/C`). GIN index.
- Admin search: single `/api/admin/search?q=&type=` endpoint that unions results from all content types with `rank` score.
- Filters: status, author, date range, category/tag (per content type).
- Sort: createdAt, updatedAt, title, publishedAt, views (blog only).

**Webhooks**
- Events: `content.published`, `content.updated`, `content.unpublished`, `content.deleted`, `media.uploaded`, `contact.submitted`, `newsletter.subscribed`.
- Payload: `{ event, entityType, entityId, entity, timestamp, signature }`. Signature = HMAC-SHA256(secret, body).
- Delivery: enqueue `WebhookDelivery` → worker POSTs → on non-2xx, retry `[30s, 5m, 30m, 2h, 12h]` then mark failed.
- Admin UI: webhook list · create/edit (pick events from multiselect) · test-fire button · deliveries log with filter by status.

**Preview Mode**
- Editor clicks "Preview" on any draft → server signs a short-lived JWT containing `{entityType, entityId, userId}` (5 min expiry) → redirects to `/api/preview?token=...` which sets a `preview-session` cookie → public page handler reads cookie, bypasses `status=PUBLISHED` filter, sets `Cache-Control: no-store`, banner "Preview mode — Exit".
- Share link: editor can generate a 24h preview link (separate route, longer-lived token, revocable).

**Redirect Manager**
- Simple table CRUD. Admin can paste bulk CSV.
- `middleware.ts` queries a cached redirect map (refreshed on write via `revalidateTag('redirects')`) — keeps redirect resolution fast (<1ms).
- Auto-created rows when admin changes a published slug (§slug management above).

**Activity Feed / Audit Log**
- Extends existing `AuditLog` to cover every CMS mutation (create, update, publish, unpublish, delete, restore-revision, media upload/delete).
- UI: filterable table (user, entityType, action, date range).
- Per-entry edit view shows a compact sidebar feed of recent actions on that entry.

---

## 4. Build Plan

### 4.1 Project Structure

The existing repo is monolithic Next.js. No restructure needed — add new folders:

```
d:\xampp\htdocs\mcaforonew\
├── app\
│   ├── (marketing)\          # existing public site, refactor to read from DB
│   ├── (portal)\             # existing client portal
│   ├── admin\                # existing — extend
│   │   ├── content\          # NEW — all marketing content CRUD
│   │   │   ├── pages\
│   │   │   ├── case-studies\
│   │   │   ├── services\
│   │   │   ├── products\
│   │   │   ├── portfolio\
│   │   │   ├── team\
│   │   │   ├── testimonials\
│   │   │   ├── faqs\
│   │   │   └── site-structure\  # values/process/stats/partners
│   │   ├── media\            # NEW
│   │   ├── cms\              # existing — add redirects, webhooks, contact-submissions
│   │   ├── settings\         # existing — add /site, /seo
│   │   └── activity\         # NEW
│   ├── api\
│   │   ├── v1\               # NEW — public read API
│   │   ├── admin\            # NEW — admin mutation API
│   │   ├── preview\          # NEW
│   │   ├── contact\          # existing
│   │   └── newsletter\       # existing
│   ├── preview\              # NEW — draft preview routes
│   ├── sitemap.xml\route.ts  # NEW
│   └── robots.txt\route.ts   # NEW
├── components\
│   ├── admin\                # NEW
│   │   ├── DataTable\
│   │   ├── RichTextEditor\   # TipTap wrapper
│   │   ├── BlockBuilder\     # page section builder
│   │   ├── MediaPicker\
│   │   ├── SeoPanel\
│   │   ├── RevisionDiff\
│   │   └── SchedulePicker\
│   └── (existing public components)
├── lib\
│   ├── cms\                  # NEW
│   │   ├── blocks\           # block catalogue (schema + render + adminForm)
│   │   │   ├── hero.ts
│   │   │   ├── featureGrid.ts
│   │   │   ├── richText.ts
│   │   │   ├── testimonials.ts
│   │   │   ├── cta.ts
│   │   │   ├── faq.ts
│   │   │   └── index.ts      # registry
│   │   ├── content.ts        # generic CRUD service
│   │   ├── revisions.ts
│   │   ├── search.ts
│   │   ├── seo.ts
│   │   └── cache.ts          # tag helpers
│   ├── media\                # NEW
│   │   ├── upload.ts
│   │   ├── variants.ts       # sharp pipeline
│   │   └── storage.ts        # fs driver (pluggable later)
│   ├── auth\
│   │   ├── session.ts        # existing
│   │   └── permissions.ts    # NEW — can() utility
│   ├── jobs\                 # NEW
│   │   ├── queue.ts          # pg-boss setup
│   │   ├── publish.ts
│   │   └── webhook.ts
│   ├── webhooks\             # NEW
│   │   ├── dispatch.ts
│   │   └── sign.ts
│   └── mdx.ts                # existing — mark for deprecation after migration
├── prisma\
│   ├── schema.prisma         # extend
│   ├── migrations\
│   └── seed.ts               # extend
├── scripts\
│   ├── migrate-mdx-to-db.ts  # NEW — one-time MDX → BlogPost/CaseStudy
│   └── backfill-media.ts     # NEW — ingest existing public image URLs
├── middleware.ts             # extend: redirects + preview cookie + auth
└── docs\                     # all architecture/PRD/runbooks
    ├── cms-architecture.md   # this doc
    ├── cms-runbook.md        # ops
    └── cms-api.md            # generated
```

### 4.2 Development Sprints (full editorial suite = 12 sprints, ~2 wks each)

| # | Sprint | Deliverables | Exit Criteria |
|---|---|---|---|
| 1 | **Foundation** | Add `CONTENT_EDITOR` role · `permissions.ts` with `can()` · extend `AuditLog` wrapper · set up `pg-boss` · Prisma migration for Media + Revision + ScheduledJob + Webhook + SiteSettings + Redirect + ContactSubmission | `can()` unit-tested; pg-boss worker processes test job; migrations applied on dev + staging |
| 2 | **Media library v1** | `Media`, `MediaFolder`, `MediaUsage` models · upload pipeline (sharp variants, dedupe by hash, magic-byte validation) · admin `/admin/media` grid + folder tree + detail · MediaPicker component | Can upload an image, see 4 variants, pick it in a test form, delete is blocked when referenced |
| 3 | **Rich Text + Block Builder** | TipTap editor component · block registry in `lib/cms/blocks/` with 6 starter blocks (hero, featureGrid, richText, cta, faq, testimonials) · Pages admin rebuild using block builder · RSC render of published pages | Can build the `/about` page in the admin out of blocks; it renders identically to the current hardcoded version |
| 4 | **Core content models** | Prisma: CaseStudy, MarketingService, MarketingProduct, Portfolio, TeamMember, Testimonial, FAQ, Value, ProcessStep, Stat, Partner + join tables · seed from current hardcoded arrays · admin list + edit screens for each (DataTable + two-col form pattern) · SEO panel component (shared) | All marketing pages read from DB; hardcoded arrays removed; `npm run dev` renders identical UI |
| 5 | **BlogPost refactor + MDX migration** | Extend `BlogPost` with new fields (TipTap JSON, status enum, scheduledAt, searchVector, authorId) · Blog admin rebuild · `migrate-mdx-to-db.ts` CLI (gray-matter → TipTap JSON via `rehype` → INSERT) · deprecate `lib/mdx.ts` | All existing `content/blog/*.mdx` entries visible in admin and render on public blog |
| 6 | **SEO & Sitemap** | `/sitemap.xml` · `/robots.txt` · JSON-LD helpers in `lib/cms/seo.ts` · SERP + OG preview component · `SiteSettings` singleton + admin `/admin/settings/site` | Google Rich Results test passes on 3 sample URLs; sitemap lists all published content |
| 7 | **Publishing workflow** | Draft/Published/Scheduled state machine · publish/unpublish/schedule Server Actions · ScheduledJob worker · revalidateTag wiring · email notification on schedule success/failure | Schedule a blog post 5 min in the future; it auto-publishes and revalidates cache |
| 8 | **Revisions + Preview mode** | `Revision` polymorphic table · autosave every 3s with diff · diff viewer (text + JSON) · rollback action · preview JWT + `/api/preview` + preview cookie · preview banner · shareable 24h preview link | Edit a page, rollback 3 versions; share a draft link; recipient sees draft with banner |
| 9 | **Menus + Redirects + Forms** | Menus admin with reorderable nested tree · Redirect CRUD + middleware enforcement + slug-change auto-redirect · Contact Submission inbox + status workflow · Newsletter admin view | Change a published page slug; old URL 301s; contact form POST shows in inbox |
| 10 | **Webhooks + Public API** | `Webhook` + `WebhookDelivery` · dispatcher worker with retry · test-fire button · deliveries log · `/api/v1/*` read endpoints with caching · OpenAPI generation from Zod | External test endpoint receives `content.published` within 2s; all v1 endpoints respond <200ms |
| 11 | **Search + Activity + Hardening** | `tsvector` columns + GIN indexes + admin search · Activity Feed page (audit log viewer) · rate limiting on public forms (upstash-ratelimit or in-memory) · CSRF double-submit · file-upload security pass · dependency audit | Search returns ranked results across 3 content types; rate-limit blocks 6th contact submission in a minute |
| 12 | **Performance, Docs, Launch** | `unstable_cache` audit · image sizes audit · bundle analyzer run · load test (k6) · `docs/cms-runbook.md` · `docs/cms-api.md` auto-gen · staging → production cutover plan · data backup procedure | p95 marketing page TTFB <200ms; runbook walkthrough complete; production cutover executed |

### 4.3 Packages & Dependencies

Already installed (reuse): `next`, `react`, `prisma`, `@prisma/client`, `zod`, `jose`, `bcryptjs`, `nodemailer`, `date-fns`, `lucide-react`, `framer-motion`, `@radix-ui/*`, `tailwindcss`, `clsx`, `class-variance-authority`, `react-hook-form`, `@hookform/resolvers`.

**Add:**

| Package | Purpose | Justification |
|---|---|---|
| `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header`, `@tiptap/extension-code-block-lowlight`, `@tiptap/extension-placeholder`, `@tiptap/extension-task-list`, `@tiptap/extension-task-item`, `@tiptap/extension-youtube`, `lowlight` | Rich text editor | Best-in-class headless editor; JSON output diffs cleanly for revisions |
| `sharp` | Image variants | Native-speed WebP/resize, de facto standard for Node |
| `file-type` | Upload magic-byte check | Prevents mime-type spoofing |
| `mime-types` | Mime lookup helpers | Small util, widely used |
| `pg-boss` | Job queue | Postgres-backed, no Redis needed, built-in retries |
| `isomorphic-dompurify` | HTML sanitization | Strips XSS from rendered TipTap HTML |
| `slugify` | Slug generation | Unicode-aware |
| `@tanstack/react-table` | Admin DataTable | Headless table primitive, composes with shadcn |
| `sonner` or continue `@radix-ui/react-toast` | Toasts | Keep existing |
| `@dnd-kit/core`, `@dnd-kit/sortable` | Drag-reorder for sections/menu items | Modern, accessible |
| `zod-to-openapi` or `@asteasolutions/zod-to-openapi` | API docs gen | Single source of truth |
| `diff`, `diff-match-patch` | Revision diffs | |
| `ulid` or continue cuid | IDs | Keep cuid (already used) |
| `rate-limiter-flexible` | Rate limit for contact/login/newsletter | Pluggable Postgres/memory backend |
| `csrf` (or custom) | CSRF double-submit | |
| `unified`, `remark-parse`, `remark-rehype`, `rehype-stringify`, `remark-gfm` (already), `hast-util-to-mdast` | One-time MDX→TipTap migration | |
| `k6` (devDep, CLI) | Load testing sprint 12 | |

### 4.4 Environment Variables

Add to `.env.example`:

```
# Existing (keep)
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRY=7d
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
APP_URL=http://localhost:3000

# New for CMS
CMS_MEDIA_ROOT=public/uploads
CMS_MEDIA_MAX_IMAGE_MB=20
CMS_MEDIA_MAX_VIDEO_MB=100
CMS_MEDIA_MAX_DOC_MB=50
CMS_CACHE_REVALIDATE_SECONDS=300
CMS_PREVIEW_SECRET=          # JWT signing secret for preview tokens
CMS_CSRF_SECRET=
CMS_WEBHOOK_RETRIES=5
CMS_WEBHOOK_TIMEOUT_MS=10000
PGBOSS_SCHEMA=pgboss         # separate schema in same DB
RATE_LIMIT_POINTS=5
RATE_LIMIT_DURATION=60
CONTACT_SUBMISSION_NOTIFY_EMAIL=
```

### 4.5 Security Checklist

Pre-launch gate (Sprint 11–12 verification):

- [ ] Every `app/api/admin/*` route verifies JWT and loads `user.roles` before any logic.
- [ ] Every admin Server Action calls `can(user, action, resource)` at entry — unit tested.
- [ ] `RoleName.CONTENT_EDITOR` cannot reach `/admin/users`, `/admin/integrations`, `/admin/settings/api-tokens`, or any portal/billing route (integration test).
- [ ] All inputs parsed through Zod schemas; reject unknown fields (`.strict()`).
- [ ] All Prisma queries use the ORM (no `$queryRaw` for user input without tagged template).
- [ ] TipTap HTML rendered only after `DOMPurify` allowlist sanitization.
- [ ] CSRF double-submit token validated on every non-GET admin route.
- [ ] Upload endpoint validates: extension allowlist, mime allowlist, magic-byte match via `file-type`, size limit, filename sanitization, SVG scripts stripped.
- [ ] `rate-limiter-flexible`: 5/min/IP on `/api/contact`, 10/min/IP on `/api/newsletter/*`, 10/min/IP on `/api/admin/auth/login`.
- [ ] No secrets in code, `.env` gitignored, `.env.example` shipped with placeholders.
- [ ] HTTPS enforced in production via `next.config.mjs` + reverse proxy.
- [ ] Security headers via middleware: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy` (strict on `/admin`, relaxed on public only for known embeds).
- [ ] `npm audit --audit-level=high` clean; GitHub Dependabot enabled.
- [ ] Preview tokens: short-lived (5m for internal, 24h for shareable), single-use preferred, revocable list in `SiteSettings`.
- [ ] Webhook secrets stored hashed; test-fire shown only once on creation.

**Deployment note (local media warning):** Because `CMS_MEDIA_ROOT=public/uploads` lives on the server filesystem and Vercel's filesystem is ephemeral, if you deploy to Vercel you **must** switch to S3/R2/Cloudinary before launch **or** deploy to a VPS (Render, Railway with persistent disk, DigitalOcean, etc.). Keep the driver in `lib/media/storage.ts` pluggable so this switch is a one-file change.

---

## 5. Next Steps

Immediate actions (this week, before sprint 1 kicks off):

1. **Confirm host target.** Local filesystem + Vercel won't work for production media. Pick: (a) VPS/Render with persistent disk, or (b) change media driver to Cloudinary/S3 before Sprint 2. I'll ask once Sprint 1 starts.
2. **Create Sprint 1 branch** `feat/cms-foundation` and apply the migration draft for the new enums + skeleton tables so the team can start on unblocked tracks.
3. **Add `CONTENT_EDITOR` role** to the `RoleName` enum and seed it.
4. **Install Sprint 1 deps:** `pg-boss`, `sharp`, `file-type`, `mime-types`, `slugify`, `isomorphic-dompurify`, `rate-limiter-flexible`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@tanstack/react-table`.
5. **Write `lib/auth/permissions.ts`** with `can(user, action, resource)` and unit tests — this gates every subsequent sprint.
6. **Archive or delete** unused `lib/mdx.ts` tests before Sprint 5 migration to avoid confusion.
7. **Kick off Sprint 1.**

Ready to start implementation when you are — say the word and I'll open Sprint 1.
