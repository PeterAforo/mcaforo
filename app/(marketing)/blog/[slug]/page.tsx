import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getBlogPostBySlug, getBlogPosts } from '@/lib/mdx'
import { generateArticleSEO } from '@/lib/seo'
import { formatDate } from '@/lib/utils'
import { compileMDX } from '@/lib/mdx-compile'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = getBlogPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) return {}

  return generateArticleSEO({
    title: post.meta.title,
    description: post.meta.description,
    pathname: `/blog/${slug}`,
    publishedTime: post.meta.date,
    authors: post.meta.author ? [post.meta.author] : undefined,
    tags: post.meta.tags,
  })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const MDXContent = await compileMDX(post.content)

  return (
    <article className="py-12">
      <div className="container">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-3xl">
          <header className="mb-12">
            <Badge variant="secondary">{post.meta.category}</Badge>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              {post.meta.title}
            </h1>
            <p className="mt-4 text-xl text-muted-foreground">
              {post.meta.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {post.meta.author && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {post.meta.author}
                </div>
              )}
              {post.meta.date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.meta.date)}
                </div>
              )}
              {post.meta.readTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.meta.readTime}
                </div>
              )}
            </div>
          </header>

          <div className="prose">
            <MDXContent />
          </div>

          {post.meta.tags && post.meta.tags.length > 0 && (
            <div className="mt-12 border-t pt-6">
              <p className="mb-2 text-sm font-medium">Tags:</p>
              <div className="flex flex-wrap gap-2">
                {post.meta.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 rounded-xl bg-muted/50 p-8 text-center">
            <h2 className="text-xl font-bold">Enjoyed this article?</h2>
            <p className="mt-2 text-muted-foreground">
              Subscribe to our newsletter for more insights and updates.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/contact">Subscribe</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
