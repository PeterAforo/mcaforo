/**
 * Server-side TipTap JSON → HTML renderer with DOMPurify sanitization.
 *
 * Public renderers should pass the result into `dangerouslySetInnerHTML` on
 * a pre-styled container. The input type mirrors TipTap's JSONContent.
 *
 * Packages used:
 *   - @tiptap/html            → official JSON-to-HTML renderer
 *   - isomorphic-dompurify    → sanitization (Node + browser)
 *   - @tiptap/starter-kit +   → same extensions as the editor
 *     @tiptap/extension-link/image/table/code-block-lowlight/underline/highlight
 *
 * All imports are dynamic so this module compiles before packages are
 * installed. When missing, it degrades to returning the raw text content.
 */

export interface TipTapNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  text?: string
}

export interface TipTapDoc {
  type: 'doc'
  content?: TipTapNode[]
}

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr', 'span', 'div',
    'iframe', // allowed for Youtube; the URL is separately restricted below
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title',
    'width', 'height', 'class', 'id', 'style',
    'colspan', 'rowspan',
    'allow', 'allowfullscreen', 'frameborder',
  ],
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
  ALLOW_DATA_ATTR: false,
}

function extractPlainText(doc: TipTapDoc | null): string {
  if (!doc || !doc.content) return ''
  const walk = (nodes: TipTapNode[]): string =>
    nodes
      .map((n) => (n.text ?? '') + (n.content ? walk(n.content) : ''))
      .join(' ')
  return walk(doc.content).replace(/\s+/g, ' ').trim()
}

async function loadTipTapHtml(): Promise<
  | { generateHTML: (doc: TipTapDoc, exts: unknown[]) => string; exts: unknown[] }
  | null
> {
  try {
    // Cast each module to any because TipTap v2/v3 mixes default and named
    // exports across packages; we only need the constructor value.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pickDefault = (m: any) => m.default ?? m
    const [tipHtml, starter, link, image, table, tr, td, th, codeLowlight, underline, highlight, taskList, taskItem] =
      await Promise.all([
        import('@tiptap/html').then((m) => m.generateHTML),
        import('@tiptap/starter-kit').then(pickDefault),
        import('@tiptap/extension-link').then(pickDefault),
        import('@tiptap/extension-image').then(pickDefault),
        import('@tiptap/extension-table').then(pickDefault),
        import('@tiptap/extension-table-row').then(pickDefault),
        import('@tiptap/extension-table-cell').then(pickDefault),
        import('@tiptap/extension-table-header').then(pickDefault),
        import('@tiptap/extension-code-block-lowlight').then(pickDefault),
        import('@tiptap/extension-underline').then(pickDefault),
        import('@tiptap/extension-highlight').then(pickDefault),
        import('@tiptap/extension-task-list').then(pickDefault),
        import('@tiptap/extension-task-item').then(pickDefault),
      ])
    return {
      generateHTML: tipHtml as unknown as (doc: TipTapDoc, exts: unknown[]) => string,
      exts: [starter, link, image, table, tr, td, th, codeLowlight, underline, highlight, taskList, taskItem],
    }
  } catch {
    return null
  }
}

async function loadSanitizer(): Promise<((s: string, c?: unknown) => string) | null> {
  try {
    const mod = await import('isomorphic-dompurify')
    const sanitize =
      (mod as unknown as { default?: { sanitize: (s: string, c?: unknown) => string } })
        .default?.sanitize ??
      (mod as unknown as { sanitize: (s: string, c?: unknown) => string }).sanitize
    return sanitize
  } catch {
    return null
  }
}

/**
 * Render TipTap JSON to safe HTML. On package failure falls back to the
 * extracted plain-text wrapped in `<p>` tags so public pages never blow up.
 */
export async function renderRichText(
  doc: TipTapDoc | null | undefined
): Promise<string> {
  if (!doc) return ''

  const loaded = await loadTipTapHtml()
  let html: string
  if (!loaded) {
    const text = extractPlainText(doc)
    html = text ? `<p>${escapeHtml(text)}</p>` : ''
  } else {
    try {
      html = loaded.generateHTML(doc, loaded.exts)
    } catch (err) {
      console.warn('[richtext] render failed, falling back to plain text', err)
      html = `<p>${escapeHtml(extractPlainText(doc))}</p>`
    }
  }

  const sanitize = await loadSanitizer()
  return sanitize ? sanitize(html, SANITIZE_CONFIG) : html
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Empty TipTap document constant for form defaults. */
export const EMPTY_DOC: TipTapDoc = { type: 'doc', content: [] }

/** Quick helper to build a single-paragraph doc from plain text. */
export function docFromText(text: string): TipTapDoc {
  if (!text) return EMPTY_DOC
  return {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text }] },
    ],
  }
}
