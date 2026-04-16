import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PricingTier {
  name: string
  description?: string
  priceMin: number
  priceMax: number
  features: string[]
  cta?: string
  href?: string
  popular?: boolean
}

interface PricingTableProps {
  tiers: PricingTier[]
  currency?: string
}

export function PricingTable({ tiers, currency = 'GHS' }: PricingTableProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="my-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tiers.map((tier) => (
        <Card
          key={tier.name}
          className={`relative flex flex-col ${
            tier.popular ? 'border-primary shadow-lg' : ''
          }`}
        >
          {tier.popular && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
              Most Popular
            </Badge>
          )}
          <CardHeader>
            <CardTitle>{tier.name}</CardTitle>
            {tier.description && (
              <CardDescription>{tier.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            <div className="mb-6">
              <span className="text-3xl font-bold">
                {formatPrice(tier.priceMin)}
              </span>
              {tier.priceMax > tier.priceMin && (
                <>
                  <span className="text-muted-foreground"> - </span>
                  <span className="text-3xl font-bold">
                    {formatPrice(tier.priceMax)}
                  </span>
                </>
              )}
            </div>
            <ul className="space-y-3">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant={tier.popular ? 'default' : 'outline'}
              asChild
            >
              <Link href={tier.href || '/contact'}>
                {tier.cta || 'Get Started'}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
