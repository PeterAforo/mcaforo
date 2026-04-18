'use client'

import * as Icons from 'lucide-react'
import { LucideProps } from 'lucide-react'

/**
 * Dynamic lucide-react icon resolver.
 *
 * Admins store icon NAMES as strings in the DB (e.g. `"Code"`, `"Shield"`).
 * This component resolves them at render time. Falls back to `HelpCircle`
 * when the name is unknown so a typo doesn't crash the page.
 */
export function Icon({
  name,
  ...props
}: { name?: string | null | undefined } & Omit<LucideProps, 'name'>) {
  if (!name) return <Icons.Circle {...props} />
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Cmp = (Icons as any)[name] as
    | React.ComponentType<LucideProps>
    | undefined
  if (!Cmp) return <Icons.HelpCircle {...props} />
  return <Cmp {...props} />
}
