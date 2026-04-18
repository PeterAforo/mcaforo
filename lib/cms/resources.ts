import {
  MarketingServiceCreate, MarketingServiceUpdate,
  MarketingProductCreate, MarketingProductUpdate,
  PortfolioCreate, PortfolioUpdate,
  CaseStudyCreate, CaseStudyUpdate,
  TeamMemberCreate, TeamMemberUpdate,
  TestimonialCreate, TestimonialUpdate,
  FAQCreate, FAQUpdate,
  ValueCreate, ValueUpdate,
  ProcessStepCreate, ProcessStepUpdate,
  StatCreate, StatUpdate,
  PartnerCreate, PartnerUpdate,
} from '@/lib/cms/schemas'
import type { Resource } from '@/lib/auth/permissions'
import type { ZodType } from 'zod'

/**
 * Resource registry — maps URL slugs to Prisma model + schemas + metadata.
 * The dynamic `/api/admin/content/[resource]` route reads from here.
 */

export interface ResourceConfig {
  slug: string
  label: string
  labelSingular: string
  model: string              // Prisma delegate key (camelCase)
  resource: Resource         // permission-matrix resource name
  cacheTag: string
  orderBy: Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[]
  searchFields: string[]
  createSchema: ZodType<unknown>
  updateSchema: ZodType<unknown>
  primaryField: string       // what to display in admin lists
  secondaryField?: string    // optional secondary column
}

export const RESOURCES: Record<string, ResourceConfig> = {
  services: {
    slug: 'services',
    label: 'Services',
    labelSingular: 'Service',
    model: 'marketingService',
    resource: 'MarketingService',
    cacheTag: 'marketing-services',
    orderBy: [{ order: 'asc' }, { title: 'asc' }],
    searchFields: ['title', 'description', 'slug'],
    createSchema: MarketingServiceCreate as unknown as ZodType<unknown>,
    updateSchema: MarketingServiceUpdate as unknown as ZodType<unknown>,
    primaryField: 'title',
    secondaryField: 'slug',
  },
  products: {
    slug: 'products',
    label: 'Products',
    labelSingular: 'Product',
    model: 'marketingProduct',
    resource: 'MarketingProduct',
    cacheTag: 'marketing-products',
    orderBy: [{ order: 'asc' }, { title: 'asc' }],
    searchFields: ['title', 'description', 'slug'],
    createSchema: MarketingProductCreate as unknown as ZodType<unknown>,
    updateSchema: MarketingProductUpdate as unknown as ZodType<unknown>,
    primaryField: 'title',
    secondaryField: 'slug',
  },
  portfolio: {
    slug: 'portfolio',
    label: 'Portfolio',
    labelSingular: 'Portfolio item',
    model: 'portfolio',
    resource: 'Portfolio',
    cacheTag: 'portfolio',
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    searchFields: ['title', 'client', 'description', 'slug'],
    createSchema: PortfolioCreate as unknown as ZodType<unknown>,
    updateSchema: PortfolioUpdate as unknown as ZodType<unknown>,
    primaryField: 'title',
    secondaryField: 'client',
  },
  'case-studies': {
    slug: 'case-studies',
    label: 'Case Studies',
    labelSingular: 'Case Study',
    model: 'caseStudy',
    resource: 'CaseStudy',
    cacheTag: 'case-studies',
    orderBy: [{ order: 'asc' }, { publishedAt: 'desc' }],
    searchFields: ['title', 'client', 'summary', 'slug'],
    createSchema: CaseStudyCreate as unknown as ZodType<unknown>,
    updateSchema: CaseStudyUpdate as unknown as ZodType<unknown>,
    primaryField: 'title',
    secondaryField: 'client',
  },
  team: {
    slug: 'team',
    label: 'Team',
    labelSingular: 'Team member',
    model: 'teamMember',
    resource: 'TeamMember',
    cacheTag: 'team',
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    searchFields: ['name', 'role', 'bio'],
    createSchema: TeamMemberCreate as unknown as ZodType<unknown>,
    updateSchema: TeamMemberUpdate as unknown as ZodType<unknown>,
    primaryField: 'name',
    secondaryField: 'role',
  },
  testimonials: {
    slug: 'testimonials',
    label: 'Testimonials',
    labelSingular: 'Testimonial',
    model: 'testimonial',
    resource: 'Testimonial',
    cacheTag: 'testimonials',
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    searchFields: ['authorName', 'authorCompany', 'quote'],
    createSchema: TestimonialCreate as unknown as ZodType<unknown>,
    updateSchema: TestimonialUpdate as unknown as ZodType<unknown>,
    primaryField: 'authorName',
    secondaryField: 'authorCompany',
  },
  faqs: {
    slug: 'faqs',
    label: 'FAQs',
    labelSingular: 'FAQ',
    model: 'fAQ',
    resource: 'FAQ',
    cacheTag: 'faqs',
    orderBy: [{ order: 'asc' }],
    searchFields: ['question', 'answer', 'category'],
    createSchema: FAQCreate as unknown as ZodType<unknown>,
    updateSchema: FAQUpdate as unknown as ZodType<unknown>,
    primaryField: 'question',
    secondaryField: 'category',
  },
  values: {
    slug: 'values',
    label: 'Values',
    labelSingular: 'Value',
    model: 'value',
    resource: 'Value',
    cacheTag: 'values',
    orderBy: [{ order: 'asc' }],
    searchFields: ['title', 'description'],
    createSchema: ValueCreate as unknown as ZodType<unknown>,
    updateSchema: ValueUpdate as unknown as ZodType<unknown>,
    primaryField: 'title',
  },
  'process-steps': {
    slug: 'process-steps',
    label: 'Process Steps',
    labelSingular: 'Process step',
    model: 'processStep',
    resource: 'ProcessStep',
    cacheTag: 'process-steps',
    orderBy: [{ step: 'asc' }, { order: 'asc' }],
    searchFields: ['title', 'description'],
    createSchema: ProcessStepCreate as unknown as ZodType<unknown>,
    updateSchema: ProcessStepUpdate as unknown as ZodType<unknown>,
    primaryField: 'title',
    secondaryField: 'step',
  },
  stats: {
    slug: 'stats',
    label: 'Stats',
    labelSingular: 'Stat',
    model: 'stat',
    resource: 'Stat' as unknown as Resource,
    cacheTag: 'stats',
    orderBy: [{ order: 'asc' }],
    searchFields: ['label', 'value'],
    createSchema: StatCreate as unknown as ZodType<unknown>,
    updateSchema: StatUpdate as unknown as ZodType<unknown>,
    primaryField: 'label',
    secondaryField: 'value',
  },
  partners: {
    slug: 'partners',
    label: 'Partners',
    labelSingular: 'Partner',
    model: 'partner',
    resource: 'Partner',
    cacheTag: 'partners',
    orderBy: [{ order: 'asc' }],
    searchFields: ['name'],
    createSchema: PartnerCreate as unknown as ZodType<unknown>,
    updateSchema: PartnerUpdate as unknown as ZodType<unknown>,
    primaryField: 'name',
  },
}

export const RESOURCE_LIST = Object.values(RESOURCES)

export function getResource(slug: string): ResourceConfig | null {
  return RESOURCES[slug] ?? null
}
