import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { getBlogPosts } from '@/lib/mdx'
import { generateSEO } from '@/lib/seo'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = generateSEO({
  title: 'Blog',
  description:
    'Insights, tutorials, and updates from the McAforo team on technology, business, and digital transformation.',
  pathname: '/blog',
})

export default function BlogPage() {
  const posts = getBlogPosts()

  return (
    <>
      <PageHeader
        title="Blog"
        subtitle="Insights, tutorials, and updates on technology, business automation, and digital transformation."
        breadcrumbs={[{ label: 'Blog', href: '/blog' }]}
      />

      {/* Blog Posts Grid */}
      <section className="py-20">
        <div className="container">
          {posts.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Card key={post.slug} className="group flex flex-col">
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      {post.readTime && (
                        <span className="text-xs text-muted-foreground">
                          {post.readTime}
                        </span>
                      )}
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription>
                      {post.date && formatDate(post.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {post.description}
                    </p>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button variant="ghost" className="w-full justify-start p-0" asChild>
                      <Link href={`/blog/${post.slug}`}>
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-md text-center">
              <p className="text-muted-foreground">
                Blog posts coming soon. Check back later for insights and
                updates.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
