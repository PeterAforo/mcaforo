import { LucideIcon } from 'lucide-react'
import * as Icons from 'lucide-react'

interface Feature {
  title: string
  description: string
  icon?: string
}

interface FeatureGridProps {
  features: Feature[]
  columns?: 2 | 3 | 4
}

export function FeatureGrid({ features, columns = 3 }: FeatureGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`my-12 grid gap-6 ${gridCols[columns]}`}>
      {features.map((feature, index) => {
        const IconComponent = feature.icon
          ? (Icons[feature.icon as keyof typeof Icons] as LucideIcon)
          : null

        return (
          <div
            key={index}
            className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
          >
            {IconComponent && (
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <IconComponent className="h-6 w-6" />
              </div>
            )}
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
