# context.md — McAforo Website + Self-Service Portal (Next.js + MDX-only Marketing)

## 1. Objective
Redevelop the McAforo website as a modern Next.js application with:
1) A high-performance marketing site using **MDX-only** content management.
2) A **self-service client portal** where clients can:
   - Sign up / log in
   - Select services and pricing options
   - Pay online (one-time and recurring)
   - Receive email + SMS alerts
   - Monitor projects and milestones
   - Submit and track support tickets
3) A site chatbot:
   - Public mode (sales + FAQs + guided service selection)
   - Client mode (post-login: billing + ticket assistance + project status)

Payments: **Flutterwave**  
SMS: **mNotify**

## 2. Non-Goals (Phase 1 boundaries)
- No headless CMS (marketing content stays in MDX).
- No complex accounting (only invoices/receipts, basic statements).
- No advanced chatbot “agentic” actions beyond documented API calls.
- No multi-tenant reseller/whitelabel in v1 (single company portal).

## 3. Target Users and Roles
### Public
- Prospects (view services, pricing guidance, case studies, blog)
- Newsletter subscribers

### Portal Roles
- **Client User**: sees own projects, invoices, subscriptions, tickets
- **Client Admin**: manages company profile, users, billing methods
- **Support Agent**: manages tickets, customer communication
- **Project Manager**: manages projects/milestones updates
- **Finance/Admin**: manages catalog, invoices, subscriptions, payments, refunds

## 4. Recommended Delivery Order (must follow)
### Phase 0 — Foundations
- Next.js App Router setup (TypeScript)
- Design system + reusable UI components
- MDX engine + content schemas
- SEO foundation (metadata, sitemap, robots, OG)
- Analytics event framework

### Phase 1 — Marketing Site (MDX-only)
- Home, About, Services (with pricing guidance), Case Studies, Blog, Contact
- Call booking + structured enquiry form
- Newsletter subscribe/unsubscribe (double opt-in)

### Phase 2 — Portal MVP (Auth + Support + Projects)
- Auth (Client + Admin roles)
- Client dashboard: profile + project list + milestone view
- Ticketing: create, reply, attachments, status updates
- Notifications: email + SMS triggers for ticket updates

### Phase 3 — Billing for One-Time Payments
- Admin creates invoice for project / service
- Client pays invoice online (Flutterwave)
- Receipt generation + email/SMS confirmations

### Phase 4 — Subscriptions (Recurring Revenue)
- Product catalog for recurring services (Domain/Hosting, Managed Care, SLA)
- Subscription lifecycle (create, renew, cancel)
- Automated renewal reminders + failed payment handling

### Phase 5 — Chatbot
- Public knowledge: services + pricing + FAQs + contact
- Client mode: ticket creation, invoice lookup, project status summary
- Human escalation to WhatsApp/email

### Phase 6 — Newsletter v2
- Segmentation (prospects vs clients)
- Campaign creation + sending + basic reports

## 5. Service Catalog (must include)
### Project-based (one-time)
- Web & Mobile Development
- Business Automation
- UI/UX Design & Prototyping
- Data Dashboards & Analytics
- Cybersecurity Assessments (starter)
- Integrations & Automation (n8n + custom)

### Recurring (subscription)
- Domain Registration + DNS Management
- Web Hosting / VPS / Managed Hosting
- Business Email (mailboxes setup and support)
- Website Care Plans (updates, backups, monitoring)
- Managed IT Support (SLA tiers)
- SEO Local Maintenance (optional recurring)

## 6. Content Model (MDX-only marketing)
MDX files under `/content/*` with frontmatter for:
- services
- case-studies
- blog (insights)
- legal pages (privacy/terms)

MDX pages embed React components for:
- FeatureGrid, PricingTable, FAQ, CTA, Testimonial, Gallery, ProcessTimeline, Stats

## 7. Portal Core Capabilities
### 7.1 Authentication & RBAC
- Email + password with secure hashing
- Email verification
- Password reset
- RBAC middleware for protected routes

### 7.2 Projects
- Projects belong to a client company
- Milestones (timeline, status, attachments)
- Updates/comments (optional in v1)

### 7.3 Support Tickets
- Ticket creation + categories + priority
- Threaded replies
- Attachments (virus scan optional later; v1: allowlist + size limits)
- Status flow: Open → In Progress → Waiting on Client → Resolved → Closed

### 7.4 Billing & Payments
- Product catalog (one-time and recurring)
- Invoice generation
- Flutterwave checkout
- Payment webhooks to confirm transactions
- Email + SMS notifications

### 7.5 Domain & Hosting
- Plans (shared/VPS/managed)
- Domain registration recorded as service item (v1: record-only; fulfillment handled by admin)
- Renewal schedule and reminders

### 7.6 Newsletter
- Double opt-in subscription
- Unsubscribe link
- Admin sending later phase (Phase 6)

## 8. Integrations
### Flutterwave
- Hosted checkout for invoices and subscriptions
- Webhook verification (signature + secret hash)
- Persist transactions + reconcile against invoices/subscriptions

### mNotify
- SMS alerts (payment success, payment failure, ticket updates, renewal reminders)
- Template-driven messages

### Email
- SMTP via environment configuration (use nodemailer)
- Templates for account verification, password reset, invoice/receipt, ticket updates, newsletter double opt-in

## 9. Technical Requirements
- Next.js 14+ (App Router), TypeScript
- Tailwind CSS + shadcn/ui
- Database: PostgreSQL (preferred) with Prisma ORM
- Auth: NextAuth/Auth.js OR custom JWT cookie auth (choose one and implement cleanly)
- Background jobs: simple cron endpoint / Vercel cron / node-cron (depending on hosting) for renewals/reminders

## 10. Security Requirements
- CSRF protection (if using cookie sessions)
- Rate limiting on auth and contact endpoints
- Input validation (zod)
- Secure headers (CSP baseline)
- Upload allowlist + max size + scanning placeholder
- Webhook signature verification (Flutterwave)
- Audit logs for admin actions (billing changes, ticket status changes)

## 11. Deliverables
- Full repository scaffold with folder structure
- `context.md`, `PRD.md`, `prompt.json`
- Working marketing site with MDX rendering
- Working portal MVP with billing and notifications
- Seed data for local development

## 12. Definition of Done
- Marketing pages render from MDX with correct metadata
- Portal auth works end-to-end
- Ticketing works with notifications
- Invoice payment via Flutterwave works with webhook confirmation
- Subscriptions and renewals reminders work (Phase 4)
- Chatbot can create ticket and link to contact or portal (Phase 5)
