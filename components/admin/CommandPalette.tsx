'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, CornerDownLeft } from 'lucide-react'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface Hit {
  type: string
  id: string
  title: string
  subtitle?: string
  href: string
}

/**
 * Sprint 4 UX polish: Admin command palette (Cmd/Ctrl+K).
 *
 * - Debounced search against `/api/admin/search`
 * - Keyboard navigation (arrow keys + Enter)
 * - Fallback to static nav links when query is empty
 */
export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Global hotkey
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!open) return
    if (q.trim().length < 2) {
      setHits([])
      return
    }
    setLoading(true)
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setHits(data.hits ?? [])
        setHighlight(0)
      } catch {
        if (!ctrl.signal.aborted) setHits([])
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, 200)
    return () => {
      ctrl.abort()
      clearTimeout(t)
    }
  }, [q, open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQ('')
      setHits([])
    }
  }, [open])

  function go(hit: Hit) {
    setOpen(false)
    router.push(hit.href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const hit = hits[highlight]
      if (hit) go(hit)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-xl overflow-hidden">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, blog, services, products…"
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {hits.length === 0 && q.trim().length >= 2 && !loading && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results for “{q}”
            </div>
          )}
          {hits.length === 0 && q.trim().length < 2 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Type at least 2 characters. Press{' '}
              <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded border">
                Esc
              </kbd>{' '}
              to close.
            </div>
          )}
          <ul>
            {hits.map((hit, i) => (
              <li
                key={`${hit.type}-${hit.id}`}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer border-l-2 ${
                  i === highlight
                    ? 'bg-accent border-mcaforo-orange'
                    : 'border-transparent hover:bg-muted'
                }`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => go(hit)}
              >
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold w-24 shrink-0">
                  {hit.type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{hit.title}</p>
                  {hit.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {hit.subtitle}
                    </p>
                  )}
                </div>
                {i === highlight && (
                  <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
