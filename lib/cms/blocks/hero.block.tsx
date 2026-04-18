import { z } from 'zod'
import Link from 'next/link'
import { renderRichText, EMPTY_DOC, type TipTapDoc } from '@/lib/cms/richtext'
import type { BlockDefinition } from './types'

export const HeroSchema = z.object({
  eyebrow: z.string().max(80).optional(),
  heading: z.string().min(1).max(160),
  body: z
    .object({ type: z.literal('doc'), content: z.any().optional() })
    .passthrough()
    .optional(),
  primaryCta: z
    .object({ label: z.string().min(1).max(40), href: z.string().min(1) })
    .optional(),
  secondaryCta: z
    .object({ label: z.string().min(1).max(40), href: z.string().min(1) })
    .optional(),
  backgroundImage: z.string().optional(),
  variant: z.enum(['default', 'centered', 'split']).default('default'),
})

export type HeroData = z.infer<typeof HeroSchema>

async function HeroRender({ data }: { data: HeroData }) {
  const bodyHtml = data.body
    ? await renderRichText(data.body as unknown as TipTapDoc)
    : ''
  const centered = data.variant === 'centered'

  return (
    <section
      className={
        'relative overflow-hidden ' +
        (data.backgroundImage
          ? 'bg-neutral-900 text-white bg-cover bg-center'
          : 'bg-gradient-to-br from-white to-slate-50')
      }
      style={
        data.backgroundImage
          ? { backgroundImage: `url(${data.backgroundImage})` }
          : undefined
      }
    >
      {data.backgroundImage && (
        <div className="absolute inset-0 bg-black/50" aria-hidden />
      )}
      <div
        className={
          'container relative z-10 py-24 md:py-32 ' +
          (centered ? 'text-center' : '')
        }
      >
        {data.eyebrow && (
          <div className="inline-block px-4 py-2 bg-mcaforo-orange/10 text-mcaforo-orange rounded-full text-sm font-medium mb-4">
            {data.eyebrow}
          </div>
        )}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
          {data.heading}
        </h1>
        {bodyHtml && (
          <div
            className={
              'mt-6 prose prose-lg max-w-2xl ' +
              (centered ? 'mx-auto ' : '') +
              (data.backgroundImage ? 'prose-invert' : '')
            }
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        )}
        {(data.primaryCta || data.secondaryCta) && (
          <div
            className={
              'mt-10 flex flex-wrap gap-4 ' + (centered ? 'justify-center' : '')
            }
          >
            {data.primaryCta && (
              <Link
                href={data.primaryCta.href}
                className="inline-flex items-center rounded-md bg-mcaforo-orange px-6 py-3 text-base font-semibold text-white shadow hover:bg-mcaforo-orange/90"
              >
                {data.primaryCta.label}
              </Link>
            )}
            {data.secondaryCta && (
              <Link
                href={data.secondaryCta.href}
                className={
                  'inline-flex items-center rounded-md border px-6 py-3 text-base font-semibold ' +
                  (data.backgroundImage
                    ? 'border-white/40 text-white hover:bg-white/10'
                    : 'border-input hover:bg-accent')
                }
              >
                {data.secondaryCta.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export const heroBlock: BlockDefinition<HeroData> = {
  type: 'hero',
  label: 'Hero',
  description:
    'Large heading with optional eyebrow, body, CTAs, and background image.',
  icon: 'LayoutPanelTop',
  schema: HeroSchema as unknown as BlockDefinition<HeroData>['schema'],
  defaults: (): HeroData => ({
    heading: 'Your hero heading',
    eyebrow: '',
    body: EMPTY_DOC as unknown as HeroData['body'],
    variant: 'default',
  }),
  render: HeroRender as unknown as BlockDefinition<HeroData>['render'],
}
