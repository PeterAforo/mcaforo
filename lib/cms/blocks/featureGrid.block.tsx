import { z } from 'zod'
import type { BlockDefinition } from './types'

export const FeatureGridSchema = z.object({
  eyebrow: z.string().max(80).optional(),
  heading: z.string().max(160).optional(),
  subheading: z.string().max(300).optional(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  items: z
    .array(
      z.object({
        icon: z.string().min(1).max(40), // lucide icon name
        title: z.string().min(1).max(100),
        description: z.string().min(1).max(400),
      })
    )
    .min(1)
    .max(12),
})

export type FeatureGridData = z.infer<typeof FeatureGridSchema>

// Minimal inline icon — we avoid importing all of lucide-react. When the
// public marketing pages land in Sprint 4 we'll wire a proper icon registry.
function IconDot() {
  return (
    <span className="inline-block h-3 w-3 rounded-full bg-mcaforo-orange" />
  )
}

function FeatureGridRender({ data }: { data: FeatureGridData }) {
  const gridCols =
    data.columns === 2
      ? 'md:grid-cols-2'
      : data.columns === 4
      ? 'md:grid-cols-2 lg:grid-cols-4'
      : 'md:grid-cols-2 lg:grid-cols-3'
  return (
    <section className="py-24">
      <div className="container">
        {(data.eyebrow || data.heading || data.subheading) && (
          <div className="mx-auto max-w-2xl text-center mb-16">
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
            {data.subheading && (
              <p className="mt-4 text-lg text-muted-foreground">
                {data.subheading}
              </p>
            )}
          </div>
        )}
        <div className={`grid gap-8 ${gridCols}`}>
          {data.items.map((item, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-mcaforo-orange/10 text-mcaforo-orange mb-6">
                <IconDot />
                <span className="sr-only">{item.icon}</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export const featureGridBlock: BlockDefinition<FeatureGridData> = {
  type: 'featureGrid',
  label: 'Feature Grid',
  description: 'Multi-column grid of features with icon, title and description.',
  icon: 'LayoutGrid',
  schema: FeatureGridSchema as unknown as BlockDefinition<FeatureGridData>['schema'],
  defaults: (): FeatureGridData => ({
    heading: 'What we offer',
    columns: 3,
    items: [
      { icon: 'Code', title: 'Feature one', description: 'Short description.' },
      { icon: 'Cog', title: 'Feature two', description: 'Short description.' },
      { icon: 'Zap', title: 'Feature three', description: 'Short description.' },
    ],
  }),
  render: FeatureGridRender,
}
