import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const contentDirectory = path.join(process.cwd(), 'content')

export interface ContentMeta {
  title: string
  description: string
  slug: string
  date?: string
  author?: string
  image?: string
  tags?: string[]
  published?: boolean
}

export interface ServiceMeta extends ContentMeta {
  category: string
  icon?: string
  pricing?: {
    starter?: { min: number; max: number }
    growth?: { min: number; max: number }
    enterprise?: { min: number; max: number }
  }
}

export interface CaseStudyMeta extends ContentMeta {
  client: string
  industry: string
  services: string[]
  results?: string[]
  testimonial?: {
    quote: string
    author: string
    role: string
  }
}

export interface BlogPostMeta extends ContentMeta {
  category: string
  readTime?: string
}

function getContentPath(type: string): string {
  return path.join(contentDirectory, type)
}

export function getContentSlugs(type: string): string[] {
  const contentPath = getContentPath(type)
  if (!fs.existsSync(contentPath)) {
    return []
  }
  return fs
    .readdirSync(contentPath)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))
}

export function getContentBySlug<T extends ContentMeta>(
  type: string,
  slug: string
): { meta: T; content: string } | null {
  const contentPath = getContentPath(type)
  const fullPath = path.join(contentPath, `${slug}.mdx`)

  if (!fs.existsSync(fullPath)) {
    return null
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  return {
    meta: {
      ...data,
      slug,
    } as T,
    content,
  }
}

export function getAllContent<T extends ContentMeta>(type: string): T[] {
  const slugs = getContentSlugs(type)
  const content = slugs
    .map((slug) => {
      const result = getContentBySlug<T>(type, slug)
      return result?.meta
    })
    .filter((item): item is T => item !== undefined)
    .filter((item) => item.published !== false)
    .sort((a, b) => {
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      return 0
    })

  return content
}

export function getServices(): ServiceMeta[] {
  return getAllContent<ServiceMeta>('services')
}

export function getServiceBySlug(slug: string) {
  return getContentBySlug<ServiceMeta>('services', slug)
}

export function getCaseStudies(): CaseStudyMeta[] {
  return getAllContent<CaseStudyMeta>('case-studies')
}

export function getCaseStudyBySlug(slug: string) {
  return getContentBySlug<CaseStudyMeta>('case-studies', slug)
}

export function getBlogPosts(): BlogPostMeta[] {
  return getAllContent<BlogPostMeta>('blog')
}

export function getBlogPostBySlug(slug: string) {
  return getContentBySlug<BlogPostMeta>('blog', slug)
}
