'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/animations/animated-section'

const blogPosts = [
  {
    title: 'How AI is Transforming Business Operations in Ghana',
    excerpt: 'Discover how artificial intelligence is revolutionizing the way Ghanaian businesses operate and compete globally.',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    date: 'April 10, 2026',
    slug: 'ai-transforming-business-ghana',
    category: 'Technology',
  },
  {
    title: 'The Complete Guide to Digital Transformation',
    excerpt: 'A step-by-step guide to successfully digitizing your business processes and staying competitive.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    date: 'April 5, 2026',
    slug: 'digital-transformation-guide',
    category: 'Business',
  },
  {
    title: 'Why Cloud-Based Solutions Are Essential for SMEs',
    excerpt: 'Learn why small and medium enterprises are rapidly adopting cloud technologies for growth.',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    date: 'March 28, 2026',
    slug: 'cloud-solutions-smes',
    category: 'Cloud',
  },
]

export function BlogSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="container">
        <AnimatedSection className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
          <div>
            <div className="inline-block px-4 py-2 bg-mcaforo-gray/10 text-mcaforo-gray rounded-full text-sm font-medium mb-4">
              Latest Insights
            </div>
            <h2 className="text-4xl font-bold tracking-tight">
              From Our{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange">
                Blog
              </span>
            </h2>
          </div>
          <Button variant="outline" className="mt-6 md:mt-0 border-2 hover:bg-mcaforo-orange hover:text-white hover:border-mcaforo-orange" asChild>
            <Link href="/blog">View All Posts</Link>
          </Button>
        </AnimatedSection>

        <StaggerChildren className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" staggerDelay={0.15}>
          {blogPosts.map((post) => (
            <StaggerItem key={post.slug}>
              <motion.article
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <Link href={`/blog/${post.slug}`}>
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-mcaforo-orange text-white text-xs font-semibold rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="h-4 w-4" />
                      {post.date}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 group-hover:text-mcaforo-gray transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-muted-foreground line-clamp-2 mb-4">
                      {post.excerpt}
                    </p>
                    
                    <span className="inline-flex items-center text-sm font-semibold text-mcaforo-gray group-hover:text-mcaforo-orange transition-colors">
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}
