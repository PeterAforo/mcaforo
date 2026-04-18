import { HeroSpline } from '@/components/hero-spline'
import { AboutSection } from '@/components/home/about-section'
import { ServicesSection } from '@/components/home/services-section'
import { ProductsSection } from '@/components/home/products-section'
import { StatsSection } from '@/components/home/stats-section'
import { BlogSection } from '@/components/home/blog-section'
import { CTASection } from '@/components/home/cta-section'
import { NewsletterSection } from '@/components/newsletter-section'
import { BottomSectionsWrapper } from '@/components/home/bottom-sections-wrapper'
import {
  getPublishedServices,
  getPublishedProducts,
  getActiveStats,
} from '@/lib/cms/public-data'

export const revalidate = 300

export default async function HomePage() {
  const [services, products, stats] = await Promise.all([
    getPublishedServices(),
    getPublishedProducts(),
    getActiveStats(),
  ])

  return (
    <>
      <HeroSpline />
      <AboutSection />
      <ServicesSection items={services} />
      <StatsSection items={stats} />
      <ProductsSection items={products} />
      <BlogSection />
      <BottomSectionsWrapper>
        <CTASection />
        <NewsletterSection />
      </BottomSectionsWrapper>
    </>
  )
}
