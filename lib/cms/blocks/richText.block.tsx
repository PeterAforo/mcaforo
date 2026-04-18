import { z } from 'zod'
import { renderRichText, EMPTY_DOC, type TipTapDoc } from '@/lib/cms/richtext'
import type { BlockDefinition } from './types'

export const RichTextSchema = z.object({
  content: z
    .object({ type: z.literal('doc'), content: z.any().optional() })
    .passthrough(),
  width: z.enum(['narrow', 'medium', 'wide']).default('medium'),
})

export type RichTextData = z.infer<typeof RichTextSchema>

async function RichTextRender({ data }: { data: RichTextData }) {
  const html = await renderRichText(data.content as unknown as TipTapDoc)
  const width =
    data.width === 'narrow'
      ? 'max-w-2xl'
      : data.width === 'wide'
      ? 'max-w-5xl'
      : 'max-w-3xl'
  return (
    <section className="py-16">
      <div className="container">
        <div
          className={`prose prose-lg mx-auto ${width}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  )
}

export const richTextBlock: BlockDefinition<RichTextData> = {
  type: 'richText',
  label: 'Rich Text',
  description: 'Free-form rich text content (headings, lists, links, images).',
  icon: 'Type',
  schema: RichTextSchema as unknown as BlockDefinition<RichTextData>['schema'],
  defaults: (): RichTextData => ({
    content: EMPTY_DOC as unknown as RichTextData['content'],
    width: 'medium',
  }),
  render: RichTextRender as unknown as BlockDefinition<RichTextData>['render'],
}
