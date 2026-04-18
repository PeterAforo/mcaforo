'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code as CodeIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading2,
  Heading3,
  Minus,
  Undo,
  Redo,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TipTapDoc } from '@/lib/cms/richtext'

/**
 * TipTap-based rich text editor.
 *
 * Props:
 *   value     TipTap JSON doc (or null for empty)
 *   onChange  called on every doc change with the new JSON
 *   onInsertImage  optional handler; if provided, the image button opens the
 *                  media picker. If omitted, prompts for a URL.
 *   placeholder    placeholder shown when empty
 *
 * The editor is initialized on the client only; SSR renders a plain textarea
 * placeholder so the form is still navigable before hydration.
 */
export interface RichTextEditorProps {
  value: TipTapDoc | null | undefined
  onChange: (doc: TipTapDoc) => void
  onInsertImage?: () => Promise<{ src: string; alt?: string } | null>
  placeholder?: string
  minHeight?: number
}

interface EditorLike {
  chain: () => {
    focus: () => {
      toggleBold: () => { run: () => void }
      toggleItalic: () => { run: () => void }
      toggleUnderline: () => { run: () => void }
      toggleStrike: () => { run: () => void }
      toggleBulletList: () => { run: () => void }
      toggleOrderedList: () => { run: () => void }
      toggleBlockquote: () => { run: () => void }
      toggleCodeBlock: () => { run: () => void }
      toggleHeading: (a: { level: number }) => { run: () => void }
      setHorizontalRule: () => { run: () => void }
      setLink: (a: { href: string }) => { run: () => void }
      unsetLink: () => { run: () => void }
      setImage: (a: { src: string; alt?: string }) => { run: () => void }
      undo: () => { run: () => void }
      redo: () => { run: () => void }
    }
  }
  isActive: (name: string, attrs?: unknown) => boolean
  getJSON: () => TipTapDoc
  commands: { setContent: (doc: unknown) => void }
  destroy: () => void
}

export function RichTextEditor({
  value,
  onChange,
  onInsertImage,
  placeholder = 'Start writing...',
  minHeight = 200,
}: RichTextEditorProps) {
  const [editor, setEditor] = useState<EditorLike | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let cleanup: (() => void) | undefined

    ;(async () => {
      try {
        const [
          { Editor },
          StarterKit,
          Link,
          Image,
          Underline,
          Placeholder,
        ] = await Promise.all([
          import('@tiptap/core'),
          import('@tiptap/starter-kit').then((m) => m.default ?? m),
          import('@tiptap/extension-link').then((m) => m.default ?? m),
          import('@tiptap/extension-image').then((m) => m.default ?? m),
          import('@tiptap/extension-underline').then((m) => m.default ?? m),
          import('@tiptap/extension-placeholder').then((m) => m.default ?? m),
        ])

        if (!mounted || !containerRef.current) return

        const ed = new Editor({
          element: containerRef.current,
          extensions: [
            (StarterKit as unknown as { configure: (o: unknown) => unknown }).configure({
              heading: { levels: [2, 3, 4] },
            }),
            (Underline as unknown as { configure?: (o: unknown) => unknown }).configure?.({}) ??
              Underline,
            (Link as unknown as { configure: (o: unknown) => unknown }).configure({
              openOnClick: false,
              autolink: true,
            }),
            (Image as unknown as { configure: (o: unknown) => unknown }).configure({
              inline: false,
            }),
            (Placeholder as unknown as { configure: (o: unknown) => unknown }).configure({
              placeholder,
            }),
          ] as unknown as unknown[],
          content: value ?? { type: 'doc', content: [] },
          onUpdate: ({ editor }: { editor: { getJSON: () => unknown } }) => {
            onChange(editor.getJSON() as TipTapDoc)
          },
          editorProps: {
            attributes: {
              class:
                'prose prose-sm max-w-none focus:outline-none min-h-[' + minHeight + 'px] px-3 py-2',
            },
          },
        }) as unknown as EditorLike

        setEditor(ed)
        cleanup = () => ed.destroy()
      } catch (err) {
        console.error('[RichTextEditor] failed to load', err)
        setLoadError(
          'Rich text editor failed to load. Run `npm install @tiptap/core @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-underline @tiptap/extension-placeholder`.'
        )
      }
    })()

    return () => {
      mounted = false
      cleanup?.()
    }
    // Intentionally only init once. Subsequent value updates are handled via the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external value updates (e.g. revision restore) without recreating the editor.
  useEffect(() => {
    if (!editor || !value) return
    const current = JSON.stringify(editor.getJSON())
    const next = JSON.stringify(value)
    if (current !== next) editor.commands.setContent(value)
  }, [value, editor])

  if (loadError) {
    return (
      <div className="rounded-md border bg-yellow-50 p-3 text-sm text-yellow-900">
        {loadError}
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-white">
      <Toolbar
        editor={editor}
        onInsertImage={async () => {
          if (!editor) return
          let src: string | null = null
          let alt: string | undefined
          if (onInsertImage) {
            const picked = await onInsertImage()
            if (!picked) return
            src = picked.src
            alt = picked.alt
          } else {
            src = window.prompt('Image URL')
          }
          if (src) editor.chain().focus().setImage({ src, alt }).run()
        }}
      />
      <div
        ref={containerRef}
        className="border-t min-h-[200px]"
        style={{ minHeight }}
      />
    </div>
  )
}

function Toolbar({
  editor,
  onInsertImage,
}: {
  editor: EditorLike | null
  onInsertImage: () => void
}) {
  if (!editor) {
    return (
      <div className="flex flex-wrap items-center gap-1 p-2 text-xs text-muted-foreground">
        Loading editor…
      </div>
    )
  }

  const btn = (
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    title: string
  ) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={title}
      className={cn('h-8 w-8 p-0', active && 'bg-slate-200')}
    >
      {icon}
    </Button>
  )

  return (
    <div className="flex flex-wrap items-center gap-1 p-2">
      {btn(
        editor.isActive('bold'),
        () => editor.chain().focus().toggleBold().run(),
        <Bold className="h-4 w-4" />,
        'Bold'
      )}
      {btn(
        editor.isActive('italic'),
        () => editor.chain().focus().toggleItalic().run(),
        <Italic className="h-4 w-4" />,
        'Italic'
      )}
      {btn(
        editor.isActive('underline'),
        () => editor.chain().focus().toggleUnderline().run(),
        <UnderlineIcon className="h-4 w-4" />,
        'Underline'
      )}
      {btn(
        editor.isActive('strike'),
        () => editor.chain().focus().toggleStrike().run(),
        <Strikethrough className="h-4 w-4" />,
        'Strike'
      )}
      <span className="mx-1 h-6 w-px bg-slate-200" />
      {btn(
        editor.isActive('heading', { level: 2 }),
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        <Heading2 className="h-4 w-4" />,
        'Heading 2'
      )}
      {btn(
        editor.isActive('heading', { level: 3 }),
        () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        <Heading3 className="h-4 w-4" />,
        'Heading 3'
      )}
      <span className="mx-1 h-6 w-px bg-slate-200" />
      {btn(
        editor.isActive('bulletList'),
        () => editor.chain().focus().toggleBulletList().run(),
        <List className="h-4 w-4" />,
        'Bulleted list'
      )}
      {btn(
        editor.isActive('orderedList'),
        () => editor.chain().focus().toggleOrderedList().run(),
        <ListOrdered className="h-4 w-4" />,
        'Ordered list'
      )}
      {btn(
        editor.isActive('blockquote'),
        () => editor.chain().focus().toggleBlockquote().run(),
        <Quote className="h-4 w-4" />,
        'Blockquote'
      )}
      {btn(
        editor.isActive('codeBlock'),
        () => editor.chain().focus().toggleCodeBlock().run(),
        <CodeIcon className="h-4 w-4" />,
        'Code block'
      )}
      <span className="mx-1 h-6 w-px bg-slate-200" />
      {btn(
        editor.isActive('link'),
        () => {
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run()
          } else {
            const url = window.prompt('URL')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }
        },
        <LinkIcon className="h-4 w-4" />,
        'Link'
      )}
      {btn(false, onInsertImage, <ImageIcon className="h-4 w-4" />, 'Image')}
      {btn(
        false,
        () => editor.chain().focus().setHorizontalRule().run(),
        <Minus className="h-4 w-4" />,
        'Horizontal rule'
      )}
      <span className="ml-auto flex items-center gap-1">
        {btn(
          false,
          () => editor.chain().focus().undo().run(),
          <Undo className="h-4 w-4" />,
          'Undo'
        )}
        {btn(
          false,
          () => editor.chain().focus().redo().run(),
          <Redo className="h-4 w-4" />,
          'Redo'
        )}
      </span>
    </div>
  )
}
