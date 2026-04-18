import type { SessionUser } from '@/lib/auth'

/**
 * CMS permission matrix.
 *
 * Usage:
 *   import { can } from '@/lib/auth/permissions'
 *   if (!can(session, 'content.publish', 'BlogPost')) throw new Error('Forbidden')
 *
 * Roles are stored on the JWT payload (`session.roles: string[]`).
 * A user having the ADMIN role is granted all permissions unconditionally.
 *
 * Resources are string identifiers that map to either a Prisma model name
 * (e.g. "BlogPost", "Page", "Media") or a coarse area ("settings", "users",
 * "integrations", "billing", "portal", "activity").
 */

export type Role =
  | 'ADMIN'
  | 'CONTENT_EDITOR'
  | 'PM'
  | 'SUPPORT'
  | 'FINANCE'
  | 'CLIENT_ADMIN'
  | 'CLIENT_USER'

// Coarse action verbs. Fine-grained checks can be layered on top per caller.
export type Action =
  | 'content.read'
  | 'content.create'
  | 'content.update'
  | 'content.delete'
  | 'content.publish'
  | 'content.schedule'
  | 'content.restore_revision'
  | 'media.read'
  | 'media.upload'
  | 'media.update'
  | 'media.delete'
  | 'menu.read'
  | 'menu.update'
  | 'menu.manage'
  | 'redirect.manage'
  | 'contact.read'
  | 'contact.update'
  | 'webhook.manage'
  | 'settings.read'
  | 'settings.update'
  | 'users.manage'
  | 'roles.manage'
  | 'integrations.manage'
  | 'activity.read'
  | 'billing.manage'
  | 'portal.manage'

export type Resource =
  // Content models
  | 'Page'
  | 'BlogPost'
  | 'CaseStudy'
  | 'MarketingService'
  | 'MarketingProduct'
  | 'Portfolio'
  | 'TeamMember'
  | 'Testimonial'
  | 'FAQ'
  | 'Value'
  | 'ProcessStep'
  | 'Stat'
  | 'Partner'
  // CMS areas
  | 'Media'
  | 'Menu'
  | 'Redirect'
  | 'ContactSubmission'
  | 'Webhook'
  | 'SiteSettings'
  | 'ApiKey'
  | 'Revision'
  // Platform areas
  | 'User'
  | 'Role'
  | 'Integration'
  | 'AuditLog'
  | 'Billing'
  | 'Portal'

const CONTENT_RESOURCES: ReadonlySet<Resource> = new Set([
  'Page',
  'BlogPost',
  'CaseStudy',
  'MarketingService',
  'MarketingProduct',
  'Portfolio',
  'TeamMember',
  'Testimonial',
  'FAQ',
  'Value',
  'ProcessStep',
  'Stat',
  'Partner',
])

const CONTENT_EDITOR_ALLOWED_ACTIONS: ReadonlySet<Action> = new Set([
  'content.read',
  'content.create',
  'content.update',
  'content.delete',
  'content.publish',
  'content.schedule',
  'content.restore_revision',
  'media.read',
  'media.upload',
  'media.update',
  'media.delete',
  'menu.read',
  'menu.update',
  'menu.manage',
  'redirect.manage',
  'contact.read',
  'contact.update',
  'settings.read',
  'activity.read',
])

/**
 * Check whether the given session has permission to perform `action` on
 * `resource`. Returns false on unauthenticated session or role mismatch.
 */
export function can(
  session: SessionUser | null | undefined,
  action: Action,
  resource: Resource
): boolean {
  if (!session) return false
  const roles = (session.roles ?? []) as Role[]
  if (roles.length === 0) return false

  // Admin bypass — full access.
  if (roles.includes('ADMIN')) return true

  // Content editor: marketing content + media + menus + redirects +
  // contact inbox + activity log. Explicitly NOT: users, roles, integrations,
  // webhooks, billing, portal, site-settings mutation.
  if (roles.includes('CONTENT_EDITOR')) {
    if (!CONTENT_EDITOR_ALLOWED_ACTIONS.has(action)) return false

    if (action.startsWith('content.')) {
      return CONTENT_RESOURCES.has(resource)
    }
    if (action.startsWith('media.')) return resource === 'Media'
    if (action === 'menu.read' || action === 'menu.update' || action === 'menu.manage') return resource === 'Menu'
    if (action === 'redirect.manage') return resource === 'Redirect'
    if (action === 'contact.read' || action === 'contact.update')
      return resource === 'ContactSubmission'
    if (action === 'settings.read') return resource === 'SiteSettings'
    if (action === 'activity.read') return resource === 'AuditLog'
    return false
  }

  // PM: read-only on marketing content; manages projects via separate portal
  // routes (not CMS). No media writes.
  if (roles.includes('PM')) {
    if (action === 'content.read' && CONTENT_RESOURCES.has(resource)) return true
    if (action === 'media.read') return resource === 'Media'
    if (action === 'activity.read') return resource === 'AuditLog'
    return false
  }

  // FINANCE: billing + payment integrations only. No CMS access.
  if (roles.includes('FINANCE')) {
    if (action === 'billing.manage') return resource === 'Billing'
    if (action === 'integrations.manage') return resource === 'Integration'
    return false
  }

  // SUPPORT: portal tickets only. No CMS access.
  if (roles.includes('SUPPORT')) {
    if (action === 'portal.manage') return resource === 'Portal'
    return false
  }

  // Client roles never have CMS access.
  return false
}

/**
 * Throws a typed authorization error when the check fails. Convenience for
 * Server Actions and Route Handlers.
 */
export class ForbiddenError extends Error {
  readonly action: Action
  readonly resource: Resource
  constructor(action: Action, resource: Resource) {
    super(`Forbidden: missing permission ${action} on ${resource}`)
    this.name = 'ForbiddenError'
    this.action = action
    this.resource = resource
  }
}

export function requirePermission(
  session: SessionUser | null | undefined,
  action: Action,
  resource: Resource
): asserts session is SessionUser {
  if (!session) {
    throw new ForbiddenError(action, resource)
  }
  if (!can(session, action, resource)) {
    throw new ForbiddenError(action, resource)
  }
}

/**
 * Narrow predicate: does the user have ANY CMS content-editing capability?
 * Used to decide whether the "Content" nav group is visible in the admin
 * layout.
 */
export function hasCmsAccess(session: SessionUser | null | undefined): boolean {
  if (!session) return false
  const roles = session.roles ?? []
  return (
    roles.includes('ADMIN') ||
    roles.includes('CONTENT_EDITOR') ||
    roles.includes('PM')
  )
}
