import { z } from 'zod'

/** Zod schemas for Sprint 4 marketing content models. */

const ContentStatus = z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'])

export const MarketingServiceCreate = z.object({
  slug: z.string().min(1).max(80),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(500),
  icon: z.string().min(1).max(40).default('Sparkles'),
  featuredImage: z.string().nullable().optional(),
  body: z.unknown().optional(),
  features: z.array(z.string()).default([]),
  pricingNote: z.string().max(200).nullable().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  status: ContentStatus.default('PUBLISHED'),
})
export const MarketingServiceUpdate = MarketingServiceCreate.partial()

export const MarketingProductCreate = z.object({
  slug: z.string().min(1).max(80),
  title: z.string().min(1).max(160),
  tagline: z.string().max(200).nullable().optional(),
  description: z.string().min(1).max(1000),
  icon: z.string().min(1).max(40).default('Package'),
  heroImage: z.string().nullable().optional(),
  screenshots: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  modules: z.unknown().optional(),
  demoUrl: z.string().url().nullable().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  status: ContentStatus.default('PUBLISHED'),
})
export const MarketingProductUpdate = MarketingProductCreate.partial()

export const PortfolioCreate = z.object({
  slug: z.string().min(1).max(80),
  client: z.string().min(1).max(120),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(1000),
  heroImage: z.string().nullable().optional(),
  gallery: z.array(z.string()).default([]),
  results: z.unknown().optional(),
  year: z.number().int().nullable().optional(),
  isFeatured: z.boolean().default(false),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  status: ContentStatus.default('PUBLISHED'),
})
export const PortfolioUpdate = PortfolioCreate.partial()

export const CaseStudyCreate = z.object({
  slug: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  client: z.string().min(1).max(120),
  industry: z.string().max(120).nullable().optional(),
  summary: z.string().min(1).max(500),
  content: z.unknown().optional(),
  heroImage: z.string().nullable().optional(),
  gallery: z.array(z.string()).default([]),
  results: z.unknown().optional(),
  year: z.number().int().nullable().optional(),
  isFeatured: z.boolean().default(false),
  order: z.number().int().default(0),
  metaTitle: z.string().max(80).nullable().optional(),
  metaDescription: z.string().max(200).nullable().optional(),
  status: ContentStatus.default('DRAFT'),
  scheduledAt: z.string().datetime().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
})
export const CaseStudyUpdate = CaseStudyCreate.partial()

export const TeamMemberCreate = z.object({
  slug: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  bio: z.string().max(2000).nullable().optional(),
  photo: z.string().nullable().optional(),
  socials: z.unknown().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})
export const TeamMemberUpdate = TeamMemberCreate.partial()

export const TestimonialCreate = z.object({
  authorName: z.string().min(1).max(120),
  authorRole: z.string().max(120).nullable().optional(),
  authorCompany: z.string().max(120).nullable().optional(),
  authorPhoto: z.string().nullable().optional(),
  quote: z.string().min(1).max(2000),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  portfolioId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  isFeatured: z.boolean().default(false),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})
export const TestimonialUpdate = TestimonialCreate.partial()

export const FAQCreate = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(4000),
  category: z.string().max(80).nullable().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})
export const FAQUpdate = FAQCreate.partial()

export const ValueCreate = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  icon: z.string().min(1).max(40).default('Heart'),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})
export const ValueUpdate = ValueCreate.partial()

export const ProcessStepCreate = z.object({
  step: z.number().int(),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  icon: z.string().min(1).max(40).default('Check'),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})
export const ProcessStepUpdate = ProcessStepCreate.partial()

export const StatCreate = z.object({
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(40),
  suffix: z.string().max(20).nullable().optional(),
  icon: z.string().max(40).nullable().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})
export const StatUpdate = StatCreate.partial()

export const PartnerCreate = z.object({
  name: z.string().min(1).max(120),
  logo: z.string().min(1),
  url: z.string().url().nullable().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})
export const PartnerUpdate = PartnerCreate.partial()
