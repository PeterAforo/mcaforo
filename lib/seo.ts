import type { Metadata } from 'next'

const siteConfig = {
  name: 'McAforo',
  description:
    'Digital solutions for modern businesses. Web development, business automation, UI/UX design, and managed IT services.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
}

interface SEOProps {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
  pathname?: string
}

export function generateSEO({
  title,
  description,
  image,
  noIndex = false,
  pathname = '',
}: SEOProps = {}): Metadata {
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name
  const fullDescription = description || siteConfig.description
  const url = `${siteConfig.url}${pathname}`
  const ogImage = image || `${siteConfig.url}/og-image.png`

  return {
    title: fullTitle,
    description: fullDescription,
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical: url,
    },
  }
}

export function generateArticleSEO({
  title,
  description,
  image,
  pathname = '',
  publishedTime,
  modifiedTime,
  authors,
  tags,
}: SEOProps & {
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  tags?: string[]
}): Metadata {
  const baseSEO = generateSEO({ title, description, image, pathname })

  return {
    ...baseSEO,
    openGraph: {
      ...baseSEO.openGraph,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors,
      tags,
    },
  }
}

export { siteConfig }
