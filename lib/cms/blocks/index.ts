import type { BlockDefinition, SectionRecord } from './types'

import { heroBlock } from './hero.block'
import { featureGridBlock } from './featureGrid.block'
import { richTextBlock } from './richText.block'
import { ctaBlock } from './cta.block'
import { faqBlock } from './faq.block'
import { testimonialsBlock } from './testimonials.block'

/**
 * Block registry — single source of truth for every section type.
 *
 * To add a new block:
 *   1. Create `./<name>.block.tsx` exporting a `BlockDefinition`
 *   2. Import it below and add it to BLOCKS
 *   3. The admin picker, validation, and public render pick it up automatically
 */

export const BLOCKS: Record<string, BlockDefinition<unknown>> = {
  [heroBlock.type]: heroBlock as BlockDefinition<unknown>,
  [featureGridBlock.type]: featureGridBlock as BlockDefinition<unknown>,
  [richTextBlock.type]: richTextBlock as BlockDefinition<unknown>,
  [ctaBlock.type]: ctaBlock as BlockDefinition<unknown>,
  [faqBlock.type]: faqBlock as BlockDefinition<unknown>,
  [testimonialsBlock.type]: testimonialsBlock as BlockDefinition<unknown>,
}

export const BLOCK_LIST: BlockDefinition<unknown>[] = Object.values(BLOCKS)

export function getBlock(type: string | null | undefined): BlockDefinition<unknown> | null {
  if (!type) return null
  return BLOCKS[type] ?? null
}

/**
 * Validate a section payload against its registered block schema.
 * Returns parsed data on success, or an array of error paths.
 */
export function validateSection(
  blockType: string,
  data: unknown
): { ok: true; data: unknown } | { ok: false; errors: string[] } {
  const block = getBlock(blockType)
  if (!block) return { ok: false, errors: [`Unknown block type: ${blockType}`] }
  const result = block.schema.safeParse(data)
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.errors.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      ),
    }
  }
  return { ok: true, data: result.data }
}

export type { BlockDefinition, SectionRecord }
