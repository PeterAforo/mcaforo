'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  FolderPlus,
  Folder,
  FolderOpen,
  Upload,
  Search,
  Trash2,
  Loader2,
  X,
  Image as ImageIcon,
  FileText as FileIcon,
  Film,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

import {
  listMedia,
  listFolders,
  createFolder,
  deleteFolder,
  deleteMediaItem,
  uploadFile,
  ApiError,
  type MediaItem,
  type MediaFolderItem,
} from '@/lib/media/client'
import { mediaUrl, humanFileSize, isImage, isVideo } from '@/lib/media/url'

interface FolderNode extends MediaFolderItem {
  children: FolderNode[]
}

function buildTree(flat: MediaFolderItem[]): FolderNode[] {
  const map = new Map<string, FolderNode>()
  flat.forEach((f) => map.set(f.id, { ...f, children: [] }))
  const roots: FolderNode[] = []
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

export default function MediaLibraryPage() {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [folders, setFolders] = useState<MediaFolderItem[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<{ name: string; pct: number }[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const tree = useMemo(() => buildTree(folders), [folders])

  const reloadFolders = useCallback(async () => {
    try {
      const { folders } = await listFolders()
      setFolders(folders)
    } catch (err) {
      toast({
        title: 'Failed to load folders',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    }
  }, [toast])

  const reloadItems = useCallback(async () => {
    setLoading(true)
    try {
      const { items } = await listMedia({
        folder: currentFolder,
        search: search || undefined,
        limit: 80,
      })
      setItems(items)
      setSelected(new Set())
    } catch (err) {
      toast({
        title: 'Failed to load media',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [currentFolder, search, toast])

  useEffect(() => {
    reloadFolders()
  }, [reloadFolders])

  useEffect(() => {
    reloadItems()
  }, [reloadItems])

  async function handleCreateFolder() {
    const name = window.prompt('Folder name')
    if (!name) return
    try {
      await createFolder(name, currentFolder)
      toast({ title: 'Folder created' })
      reloadFolders()
    } catch (err) {
      toast({
        title: 'Failed to create folder',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    }
  }

  async function handleDeleteFolder(id: string, name: string) {
    if (!window.confirm(`Delete folder "${name}"? It must be empty.`)) return
    try {
      await deleteFolder(id)
      toast({ title: 'Folder deleted' })
      if (currentFolder === id) setCurrentFolder(null)
      reloadFolders()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NOT_EMPTY') {
        toast({
          title: 'Folder not empty',
          description: 'Remove or move contents first.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Delete failed',
          description: err instanceof Error ? err.message : String(err),
          variant: 'destructive',
        })
      }
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const arr = Array.from(files)
    setUploading(arr.map((f) => ({ name: f.name, pct: 0 })))
    for (let i = 0; i < arr.length; i++) {
      const file = arr[i]
      try {
        await uploadFile(
          file,
          { folderId: currentFolder },
          (pct) =>
            setUploading((u) =>
              u.map((row, idx) => (idx === i ? { ...row, pct } : row))
            )
        )
      } catch (err) {
        toast({
          title: `Failed: ${file.name}`,
          description: err instanceof Error ? err.message : String(err),
          variant: 'destructive',
        })
      }
    }
    setUploading([])
    toast({ title: `Uploaded ${arr.length} file(s)` })
    reloadItems()
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return
    if (!window.confirm(`Delete ${selected.size} item(s)?`)) return
    const ids = Array.from(selected)
    let deleted = 0
    let blocked = 0
    for (const id of ids) {
      try {
        await deleteMediaItem(id)
        deleted++
      } catch (err) {
        if (err instanceof ApiError && err.code === 'IN_USE') {
          blocked++
        }
      }
    }
    toast({
      title: `Deleted ${deleted}/${ids.length}`,
      description: blocked
        ? `${blocked} were in use and skipped. Force-delete from detail view.`
        : undefined,
    })
    reloadItems()
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const currentPath = currentFolder
    ? folders.find((f) => f.id === currentFolder)?.path ?? '/'
    : '/'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground">
            Current folder: <code className="text-xs">{currentPath}</code>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateFolder}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        {/* Folder sidebar */}
        <aside className="rounded-lg border bg-white p-3">
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Folders
          </div>
          <FolderRow
            label="All media"
            active={currentFolder === null}
            onClick={() => setCurrentFolder(null)}
            depth={0}
          />
          <FolderTree
            nodes={tree}
            depth={0}
            currentId={currentFolder}
            onSelect={setCurrentFolder}
            onDelete={handleDeleteFolder}
          />
        </aside>

        {/* Main content */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search filename, alt text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {selected.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selected.size})
              </Button>
            )}
          </div>

          {uploading.length > 0 && (
            <div className="rounded-lg border bg-white p-3 space-y-2">
              {uploading.map((u, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="flex-1 truncate">{u.name}</span>
                  <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${u.pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right">{u.pct}%</span>
                </div>
              ))}
            </div>
          )}

          <div
            className="rounded-lg border bg-white p-4 min-h-[400px]"
            onDragOver={(e) => {
              e.preventDefault()
            }}
            onDrop={(e) => {
              e.preventDefault()
              handleFiles(e.dataTransfer.files)
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-2 opacity-40" />
                <p>No media in this folder</p>
                <p className="text-sm">
                  Drag & drop files or click <strong>Upload</strong>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {items.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    selected={selected.has(item.id)}
                    onSelect={() => toggleSelect(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function FolderTree({
  nodes,
  depth,
  currentId,
  onSelect,
  onDelete,
}: {
  nodes: FolderNode[]
  depth: number
  currentId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string, name: string) => void
}) {
  return (
    <>
      {nodes.map((node) => (
        <div key={node.id}>
          <FolderRow
            label={node.name}
            count={node._count?.media}
            active={currentId === node.id}
            onClick={() => onSelect(node.id)}
            onDelete={() => onDelete(node.id, node.name)}
            depth={depth + 1}
          />
          {node.children.length > 0 && (
            <FolderTree
              nodes={node.children}
              depth={depth + 1}
              currentId={currentId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          )}
        </div>
      ))}
    </>
  )
}

function FolderRow({
  label,
  count,
  active,
  onClick,
  onDelete,
  depth,
}: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
  onDelete?: () => void
  depth: number
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded px-2 py-1.5 text-sm cursor-pointer',
        active ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-slate-100'
      )}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      onClick={onClick}
    >
      {active ? (
        <FolderOpen className="h-4 w-4 shrink-0" />
      ) : (
        <Folder className="h-4 w-4 shrink-0" />
      )}
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
      {onDelete && (
        <button
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function MediaCard({
  item,
  selected,
  onSelect,
}: {
  item: MediaItem
  selected: boolean
  onSelect: () => void
}) {
  const url = mediaUrl(item, 'thumb') ?? mediaUrl(item, 'sm')

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-slate-50 overflow-hidden',
        selected && 'ring-2 ring-primary ring-offset-1'
      )}
    >
      <button
        className="absolute top-1.5 left-1.5 z-10 h-5 w-5 rounded border-2 border-white bg-white/80 shadow"
        onClick={onSelect}
        aria-label={selected ? 'Deselect' : 'Select'}
      >
        {selected && <div className="h-full w-full bg-primary rounded-sm" />}
      </button>

      <Link
        href={`/admin/media/${item.id}`}
        className="block aspect-square w-full relative"
      >
        {isImage(item.mimeType) && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={item.altText ?? ''}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : isVideo(item.mimeType) ? (
          <div className="h-full w-full flex items-center justify-center bg-slate-200">
            <Film className="h-10 w-10 text-slate-500" />
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-slate-200">
            <FileIcon className="h-10 w-10 text-slate-500" />
          </div>
        )}
      </Link>
      <div className="p-2 text-xs">
        <p className="truncate font-medium" title={item.filename}>
          {item.filename}
        </p>
        <p className="text-muted-foreground">{humanFileSize(item.size)}</p>
      </div>
    </div>
  )
}
