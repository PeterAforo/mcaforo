# McAforo Web Portal

A modern Next.js website and self-service client portal for McAforo, featuring MDX-only marketing content, client authentication, project management, ticketing, and billing with Flutterwave integration.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Content**: MDX with frontmatter
- **Payments**: Flutterwave
- **SMS**: mNotify
- **Email**: SMTP (nodemailer)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mcaforonew
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Random string for session encryption (min 32 chars)
- `SMTP_*` - Email server configuration
- `FLW_*` - Flutterwave API keys
- `MNOTIFY_*` - mNotify SMS configuration

4. Set up the database:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (marketing)/        # Public marketing pages
│   ├── portal/             # Client portal (protected)
│   └── api/                # API routes
├── components/
│   ├── layout/             # Header, footer, navigation
│   ├── mdx/                # MDX components for content
│   ├── portal/             # Portal-specific components
│   └── ui/                 # shadcn/ui components
├── content/                # MDX content files
│   ├── services/           # Service pages
│   ├── case-studies/       # Case study pages
│   ├── blog/               # Blog posts
│   └── legal/              # Privacy, terms
├── lib/                    # Utility functions
│   ├── auth/               # Authentication helpers
│   ├── mdx/                # MDX processing
│   ├── payments/           # Flutterwave integration
│   └── notifications/      # Email & SMS
├── prisma/                 # Database schema and migrations
└── docs/                   # Project documentation
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

## Content Management

Marketing content is managed via MDX files in the `/content` directory. Each content type has its own folder with frontmatter schemas:

### Services (`/content/services/*.mdx`)
```yaml
---
title: "Service Name"
description: "Service description"
slug: "service-slug"
category: "Category"
icon: "LucideIconName"
published: true
pricing:
  starter: { min: 5000, max: 15000 }
  growth: { min: 15000, max: 50000 }
  enterprise: { min: 50000, max: 150000 }
---
```

### Blog Posts (`/content/blog/*.mdx`)
```yaml
---
title: "Post Title"
description: "Post description"
slug: "post-slug"
date: "2024-01-15"
author: "Author Name"
category: "Category"
readTime: "5 min read"
published: true
---
```

### Case Studies (`/content/case-studies/*.mdx`)
```yaml
---
title: "Case Study Title"
description: "Brief description"
slug: "case-study-slug"
date: "2024-01-01"
client: "Client Name"
industry: "Industry"
services: ["Service 1", "Service 2"]
published: true
---
```

## Portal Features

### Client Features
- Sign up / email verification / login
- View projects and milestones
- Create and track support tickets
- View and pay invoices
- Manage subscriptions

### Admin Features
- Manage users and roles
- Update project milestones
- Respond to tickets
- Create invoices
- View payment history
- Audit logs

## API Endpoints

### Public
- `POST /api/contact` - Submit contact form
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `GET /api/newsletter/confirm` - Confirm subscription
- `GET /api/newsletter/unsubscribe` - Unsubscribe

### Protected (Portal)
- `GET/POST /api/tickets` - Ticket management
- `GET/POST /api/projects` - Project data
- `POST /api/flutterwave/initialize` - Initialize payment
- `POST /api/flutterwave/webhook` - Payment webhook

## Deployment

The application can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Self-hosted** with Node.js

Ensure all environment variables are configured in your deployment platform.

## License

Proprietary - McAforo
