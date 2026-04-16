# PRD.md — McAforo Next.js Website + Self-Service Portal

## 1. Overview
This PRD defines requirements for a Next.js-based McAforo website rebuild with MDX-only marketing content and a self-service portal for support, project monitoring, and payments.

## 2. Goals
- Increase conversion through modern UX, clear pricing guidance, and fast performance.
- Enable clients to self-serve: select services, pay online, track project progress, and request support.
- Create recurring revenue channels via domain/hosting and managed service subscriptions.
- Provide reliable email and SMS notifications (mNotify) and secure payments (Flutterwave).

## 3. Success Metrics
- Marketing:
  - +30% increase in qualified enquiries within 60 days of launch
  - Core Web Vitals: LCP < 2.5s; CLS < 0.1; INP within “good”
- Portal:
  - 70% of support requests submitted via portal within 90 days
  - 80% of invoices paid online
  - Subscription churn tracked and renewal reminders sent on schedule

## 4. User Stories

### 4.1 Prospect (Public)
- As a prospect, I can browse services with pricing guidance and deliverables.
- As a prospect, I can view case studies and outcomes.
- As a prospect, I can book a call and submit an enquiry.
- As a prospect, I can subscribe/unsubscribe to the newsletter.

### 4.2 Client (Portal)
- As a client, I can sign up, verify email, and log in securely.
- As a client, I can view my projects and milestones.
- As a client, I can create support tickets and attach files.
- As a client, I can see invoices and pay online via Flutterwave.
- As a client, I can subscribe to hosting/maintenance plans and see renewal dates.
- As a client, I receive email + SMS alerts for ticket updates and payments.

### 4.3 Admin/Support/Finance
- As finance, I can create invoices, mark items, and see payment status.
- As finance, I can manage product catalog and pricing plans.
- As support, I can respond to tickets, change status, and notify clients.
- As project manager, I can update milestones and add notes/attachments.
- As admin, I can manage users/roles and view audit logs.

## 5. Scope

### Phase 0 — Foundations
**In scope**
- Next.js App Router + TS
- Design system + UI components
- MDX rendering pipeline + frontmatter validation
- SEO + Analytics scaffolding

### Phase 1 — Marketing (MDX-only)
**Pages**
- Home
- About (incl. process timeline)
- Services (index) + Service detail pages (pricing guidance)
- Case Studies (index + detail pages)
- Blog (index + post pages)
- Contact (call booking + enquiry form)
- Legal (Privacy, Terms)

**Features**
- Site search (services/case studies/blog) (optional in Phase 1; recommended)
- Newsletter: subscribe/unsubscribe + double opt-in

### Phase 2 — Portal MVP
**Features**
- Auth: signup, email verify, login, logout, reset password
- RBAC-protected routes
- Client profile + company
- Projects + milestones view
- Ticketing + attachments + notifications

### Phase 3 — One-time Billing
**Features**
- Product catalog (one-time items)
- Invoice creation (admin)
- Client invoice payment via Flutterwave
- Webhooks for payment confirmation
- Receipt page + downloadable receipt (pdf optional)

### Phase 4 — Subscriptions
**Features**
- Subscription plans: hosting, care plans, SLA support, domain management
- Recurring billing workflow (pragmatic):
  - Persist next billing date
  - Send reminder(s)
  - Generate invoice
  - Client pays via Flutterwave
  - Update subscription status
- Cancel subscription (end of term)

### Phase 5 — Chatbot
**Public**
- Service discovery, FAQs, pricing guidance, lead capture
**Client**
- Create ticket
- List invoices + pay links
- Project status summary
**Escalation**
- Offer contact options

### Phase 6 — Newsletter v2
- Segmentation
- Campaign sends
- Basic reporting

## 6. Functional Requirements

### 6.1 Pricing Guidance on Service Pages
- Pricing cards: Starter/Growth/Enterprise
- Range-based pricing in GHS
- Included deliverables
- Add-ons
- CTA to “Select plan” (portal) or “Book a call”

### 6.2 Service Checkout (Self-Service)
- User selects a service plan
- System creates an order or invoice
- Payment via Flutterwave
- On payment success: provision request created (admin queue) + notifications sent

### 6.3 Contact Flow
- Book a call (calendar link or integrated scheduling)
- Structured enquiry form with:
  - service interest, budget range, timeline, details, attachment
- Email notifications to internal team
- Auto-reply to prospect
- Rate limiting + spam protection

### 6.4 Tickets
- Ticket fields: subject, category, priority, description, attachments
- Replies thread
- Status updates trigger email/SMS
- Internal notes (admin-only)

### 6.5 Projects
- Project overview: status, start/end, assigned PM
- Milestones: name, due date, status, attachments
- Client view is read-only (v1) except comments (optional)

### 6.6 Billing
- Products:
  - one-time
  - recurring
- Invoices:
  - number, client, items, tax/discount (optional), total, currency (GHS default)
  - status: draft/sent/paid/overdue/cancelled
- Transactions:
  - flutterwave tx ref, amount, status, raw payload (stored safely)
- Webhooks:
  - verify signature/hash
  - idempotency (do not double-mark paid)

### 6.7 Notifications
- Email templates (verification, reset, invoice, receipt, ticket update, renewal reminders)
- SMS templates (payment success/failure, renewal reminder, ticket update)
- All notifications logged (success/failure)

## 7. Non-Functional Requirements
- Performance: SSR/SSG where appropriate; minimal JS on marketing pages
- Security: OWASP basics; secure cookies; webhook verification; rate limiting
- Reliability: webhook retries + reconciliation endpoint
- Observability: structured logs; error monitoring hook placeholders

## 8. Data Model (High-level)
- users, roles, user_roles
- companies, company_users
- services (catalog), plans, add_ons
- orders, order_items
- invoices, invoice_items
- subscriptions, subscription_events
- payments/transactions
- projects, milestones, project_files
- tickets, ticket_messages, ticket_files
- notifications_log
- newsletter_subscribers, newsletter_tokens
- audit_logs

## 9. Acceptance Criteria (MVP)
- Marketing pages render from MDX with correct SEO metadata.
- Client can sign up, verify email, log in.
- Client can create a support ticket with attachment.
- Admin can respond and change status; client receives email+SMS.
- Admin can issue invoice; client pays via Flutterwave; webhook confirms and invoice becomes PAID.
- Receipt is available and notifications sent.

## 10. Risks & Mitigations
- Recurring payments complexity → implement “invoice-per-cycle” recurring workflow first.
- Webhook fraud → strict verification + idempotency + logging.
- Spam on forms → honeypot + rate limit + optional captcha later.
