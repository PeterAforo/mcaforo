import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CTAProps {
  title: string
  description?: string
  primaryText?: string
  primaryHref?: string
  secondaryText?: string
  secondaryHref?: string
  variant?: 'default' | 'centered' | 'inline'
}

export function CTA({
  title,
  description,
  primaryText = 'Get Started',
  primaryHref = '/contact',
  secondaryText,
  secondaryHref,
  variant = 'default',
}: CTAProps) {
  if (variant === 'inline') {
    return (
      <div className="my-8 flex flex-wrap items-center gap-4">
        <span className="font-medium">{title}</span>
        <Button asChild>
          <Link href={primaryHref}>
            {primaryText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`my-12 rounded-xl bg-primary p-8 text-primary-foreground ${
        variant === 'centered' ? 'text-center' : ''
      }`}
    >
      <h3 className="text-2xl font-bold">{title}</h3>
      {description && (
        <p className="mt-2 text-primary-foreground/80">{description}</p>
      )}
      <div
        className={`mt-6 flex flex-wrap gap-4 ${
          variant === 'centered' ? 'justify-center' : ''
        }`}
      >
        <Button variant="secondary" asChild>
          <Link href={primaryHref}>
            {primaryText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        {secondaryText && secondaryHref && (
          <Button
            variant="outline"
            className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            asChild
          >
            <Link href={secondaryHref}>{secondaryText}</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
