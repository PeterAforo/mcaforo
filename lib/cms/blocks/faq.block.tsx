import { z } from 'zod'
import type { BlockDefinition } from './types'

export const FaqSchema = z.object({
  eyebrow: z.string().max(80).optional(),
  heading: z.string().max(160).optional(),
  items: z
    .array(
      z.object({
        question: z.string().min(1).max(200),
        answer: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(30),
})

export type FaqData = z.infer<typeof FaqSchema>

function FaqRender({ data }: { data: FaqData }) {
  return (
    <section className="py-24 bg-slate-50">
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
        <dl className="mx-auto max-w-3xl space-y-4">
          {data.items.map((item, i) => (
            <details
              key={i}
              className="group rounded-lg bg-white border shadow-sm open:shadow-md transition"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-semibold">
                <span>{item.question}</span>
                <span className="ml-4 text-mcaforo-orange transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-5 pb-5 pt-0 text-muted-foreground">
                {item.answer}
              </div>
            </details>
          ))}
        </dl>
      </div>
    </section>
  )
}

export const faqBlock: BlockDefinition<FaqData> = {
  type: 'faq',
  label: 'FAQ',
  description: 'Accordion list of questions and answers.',
  icon: 'HelpCircle',
  schema: FaqSchema as unknown as BlockDefinition<FaqData>['schema'],
  defaults: (): FaqData => ({
    heading: 'Frequently asked questions',
    items: [
      { question: 'Question one?', answer: 'Answer one.' },
      { question: 'Question two?', answer: 'Answer two.' },
    ],
  }),
  render: FaqRender,
}
