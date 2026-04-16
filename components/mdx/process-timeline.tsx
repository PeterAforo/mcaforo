interface Step {
  title: string
  description: string
  number?: number
}

interface ProcessTimelineProps {
  steps: Step[]
  title?: string
}

export function ProcessTimeline({ steps, title }: ProcessTimelineProps) {
  return (
    <div className="my-12">
      {title && <h2 className="mb-8 text-2xl font-bold">{title}</h2>}
      <div className="relative">
        <div className="absolute left-4 top-0 h-full w-0.5 bg-border md:left-1/2 md:-translate-x-1/2" />
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`relative flex items-start gap-6 md:gap-12 ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              <div className="hidden flex-1 md:block" />
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {step.number || index + 1}
              </div>
              <div className="flex-1 rounded-lg border bg-card p-4">
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
