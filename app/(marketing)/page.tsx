import { HeroSpline } from '@/components/hero-spline'
import { AboutSection } from '@/components/home/about-section'
import { ServicesSection } from '@/components/home/services-section'
import { ProductsSection } from '@/components/home/products-section'
import { StatsSection } from '@/components/home/stats-section'
import { ProjectsSection } from '@/components/home/projects-section'
import { BlogSection } from '@/components/home/blog-section'
import { CTASection } from '@/components/home/cta-section'
import { NewsletterSection } from '@/components/newsletter-section'

export default function HomePage() {
  return (
    <>
      {/* Hero Section with 3D Spline */}
      <HeroSpline />

      {/* About Section */}
      <AboutSection />

      {/* Services Section */}
      <ServicesSection />

      {/* Stats Section with Parallax */}
      <StatsSection />

      {/* Products Section */}
      <ProductsSection />

      {/* Projects Section */}
      <ProjectsSection />

      {/* Blog Section */}
      <BlogSection />

      {/* CTA Section with Parallax */}
      <CTASection />

      {/* Newsletter Section */}
      <NewsletterSection />
    </>
  )
}
