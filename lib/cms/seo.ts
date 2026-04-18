import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export interface SeoInput {
  title?: string
  description?: string
  ogImage?: string | null
  canonicalUrl?: string | null
  noindex?: boolean
  pathname?: string
}

/** Sprint 6: Build a Next.js Metadata object from SEO inputs. */
export function buildMetadata(input: SeoInput): Metadata {
  const title = input.title
  const description = input.description
  const url = input.canonicalUrl ?? (input.pathname ? `${SITE_URL}${input.pathname}` : undefined)
  const ogImages = input.ogImage ? [{ url: input.ogImage }] : undefined
  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    robots: input.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url,
      images: ogImages,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: input.ogImage ? [input.ogImage] : undefined,
    },
  }
}

/** Organization schema for the site root. */
export function organizationJsonLd(settings: {
  siteName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  address?: string | null
  socials?: Record<string, string> | null
  logo?: string | null
}) {
  const sameAs = settings.socials
    ? Object.values(settings.socials).filter(Boolean)
    : undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.siteName ?? 'McAforo',
    url: SITE_URL,
    logo: settings.logo ? `${SITE_URL}${settings.logo}` : undefined,
    contactPoint: settings.contactEmail
      ? {
          '@type': 'ContactPoint',
          email: settings.contactEmail,
          telephone: settings.contactPhone ?? undefined,
          contactType: 'customer service',
        }
      : undefined,
    address: settings.address
      ? { '@type': 'PostalAddress', streetAddress: settings.address }
      : undefined,
    sameAs,
  }
}

export function articleJsonLd(post: {
  title: string
  description?: string | null
  author?: string | null
  featuredImage?: string | null
  publishedAt?: Date | null
  updatedAt?: Date | null
  slug: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description ?? undefined,
    image: post.featuredImage ? [post.featuredImage] : undefined,
    author: post.author ? { '@type': 'Person', name: post.author } : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: (post.updatedAt ?? post.publishedAt)?.toISOString(),
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  }
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  }
}

export function breadcrumbJsonLd(trail: { label: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.label,
      item: `${SITE_URL}${t.href}`,
    })),
  }
}
