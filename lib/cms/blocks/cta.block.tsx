import { z } from 'zod'
import Link from 'next/link'
import type { BlockDefinition } from './types'

export const CtaSchema = z.object({
  heading: z.string().min(1).max(200),
  body: z.string().max(500).optional(),
  primaryCta: z.object({
    label: z.string().min(1).max(40),
    href: z.string().min(1),
  }),
  secondaryCta: z
    .object({ label: z.string().min(1).max(40), href: z.string().min(1) })
    .optional(),
  theme: z.enum(['orange', 'dark', 'light']).default('orange'),
})

export type CtaData = z.infer<typeof CtaSchema>

function CtaRender({ data }: { data: CtaData }) {
  const bgClass =
    data.theme === 'dark'
      ? 'bg-neutral-900 text-white'
      : data.theme === 'light'
      ? 'bg-slate-50'
      : 'bg-mcaforo-orange text-white'
  const primaryBtn =
    data.theme === 'orange'
      ? 'bg-white text-mcaforo-orange hover:bg-gray-100'
      : 'bg-mcaforo-orange text-white hover:bg-mcaforo-orange/90'
  const secondaryBtn =
    data.theme === 'orange'
      ? 'border border-white/40 text-white hover:bg-white/10'
      : 'border border-input hover:bg-accent'

  return (
    <section className={`py-24 ${bgClass}`}>
      <div className="container text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          {data.heading}
        </h2>
        {data.body && (
          <p
            className={
              'mt-6 text-xl max-w-2xl mx-auto ' +
              (data.theme === 'orange' || data.theme === 'dark'
                ? 'text-white/90'
                : 'text-muted-foreground')
            }
          >
            {data.body}
          </p>
        )}
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href={data.primaryCta.href}
            className={`inline-flex items-center rounded-md px-8 py-3 text-lg font-semibold shadow ${primaryBtn}`}
          >
            {data.primaryCta.label}
          </Link>
          {data.secondaryCta && (
            <Link
              href={data.secondaryCta.href}
              className={`inline-flex items-center rounded-md px-8 py-3 text-lg font-semibold ${secondaryBtn}`}
            >
              {data.secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

export const ctaBlock: BlockDefinition<CtaData> = {
  type: 'cta',
  label: 'Call to Action',
  description: 'Prominent CTA section with heading, body and one or two buttons.',
  icon: 'Megaphone',
  schema: CtaSchema as unknown as BlockDefinition<CtaData>['schema'],
  defaults: (): CtaData => ({
    heading: 'Ready to get started?',
    body: '',
    primaryCta: { label: 'Contact us', href: '/contact' },
    theme: 'orange',
  }),
  render: CtaRender,
}
