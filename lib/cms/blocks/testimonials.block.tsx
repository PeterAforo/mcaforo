import { z } from 'zod'
import type { BlockDefinition } from './types'

export const TestimonialsSchema = z.object({
  eyebrow: z.string().max(80).optional(),
  heading: z.string().max(160).optional(),
  items: z
    .array(
      z.object({
        quote: z.string().min(1).max(1000),
        authorName: z.string().min(1).max(100),
        authorRole: z.string().max(100).optional(),
        authorCompany: z.string().max(100).optional(),
        authorPhoto: z.string().optional(),
      })
    )
    .min(1)
    .max(20),
  layout: z.enum(['grid', 'single']).default('grid'),
})

export type TestimonialsData = z.infer<typeof TestimonialsSchema>

function TestimonialsRender({ data }: { data: TestimonialsData }) {
  return (
    <section className="py-24">
      <div className="container">
        {(data.eyebrow || data.heading) && (
          <div className="mx-auto max-w-2xl text-center mb-12">
            {data.eyebrow && (
              <div className="inline-block px-4 py-2 bg-mcaforo-orange/10 text-mcaforo-orange rounded-full text-sm font-medium mb-4">
                {data.eyebrow}
              </div>
            )}
            {data.heading && (
              <h2 className="text-4xl font-bold tracking-tight">
                {data.heading}
              </h2>
            )}
          </div>
        )}
        <div
          className={
            data.layout === 'single'
              ? 'mx-auto max-w-2xl'
              : 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
          }
        >
          {data.items.map((t, i) => (
            <figure
              key={i}
              className="rounded-2xl bg-white border p-6 shadow-sm"
            >
              <blockquote className="text-lg leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                {t.authorPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.authorPhoto}
                    alt={t.authorName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-semibold">{t.authorName}</div>
                  {(t.authorRole || t.authorCompany) && (
                    <div className="text-sm text-muted-foreground">
                      {[t.authorRole, t.authorCompany].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export const testimonialsBlock: BlockDefinition<TestimonialsData> = {
  type: 'testimonials',
  label: 'Testimonials',
  description: 'Quote cards from clients or reviewers.',
  icon: 'Quote',
  schema: TestimonialsSchema as unknown as BlockDefinition<TestimonialsData>['schema'],
  defaults: (): TestimonialsData => ({
    heading: 'What clients say',
    layout: 'grid',
    items: [
      {
        quote: 'Great work and great team.',
        authorName: 'Client Name',
        authorRole: 'CEO',
        authorCompany: 'Company',
      },
    ],
  }),
  render: TestimonialsRender,
}
