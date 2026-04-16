interface Stat {
  value: string
  label: string
  description?: string
}

interface StatsProps {
  stats: Stat[]
  variant?: 'default' | 'cards'
}

export function Stats({ stats, variant = 'default' }: StatsProps) {
  if (variant === 'cards') {
    return (
      <div className="my-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="rounded-lg border bg-card p-6 text-center"
          >
            <div className="text-4xl font-bold text-primary">{stat.value}</div>
            <div className="mt-2 font-medium">{stat.label}</div>
            {stat.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.description}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="my-12 grid grid-cols-2 gap-8 border-y py-8 md:grid-cols-4">
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className="text-4xl font-bold text-primary">{stat.value}</div>
          <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
