import type { ZodSchema } from 'zod'
import type { ComponentType } from 'react'

/**
 * Block registry types.
 *
 * Every block type is a `BlockDefinition` with four parts:
 *   - schema:    Zod schema validating `data` payload before DB write
 *   - defaults:  factory producing a fresh block payload for the builder UI
 *   - render:    React component that renders the block on the public site
 *                (must be server-safe; avoid client-only hooks at top level)
 *   - Admin form comes from a separate registry (dynamic import) so this
 *                module stays fast for the public render path.
 *
 * `TData` is the inferred payload shape per block. Use `BlockData<'hero'>` in
 * callers to get strongly typed payloads.
 */

export interface BlockDefinition<TData = unknown> {
  /** Machine name, e.g. "hero" */
  type: string
  /** Human label shown in the block picker */
  label: string
  /** Short description for the picker */
  description: string
  /** Lucide icon name for the picker */
  icon: string
  /** Zod schema for the data payload */
  schema: ZodSchema<TData>
  /** Factory returning a fresh, valid payload */
  defaults: () => TData
  /** Server-renderable component */
  render: ComponentType<{ data: TData }>
}

export interface SectionRecord {
  id: string
  blockType: string
  data: unknown
  order: number
  isActive: boolean
}
