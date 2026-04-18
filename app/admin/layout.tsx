'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  Ticket,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Package,
  Layout,
  Newspaper,
  Plug,
  Repeat,
  Image as ImageIcon,
  Briefcase,
  Users2,
  MessageSquareQuote,
  HelpCircle,
  Heart,
  ListOrdered,
  BarChart3,
  Handshake,
  FolderOpen,
} from 'lucide-react'

import { CommandPalette } from '@/components/admin/CommandPalette'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
}

// Top-level items (no group) — reserved for the dashboard only
const topLevelItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
]

const navGroups: NavGroup[] = [
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    items: [
      { href: '/admin/companies', label: 'Companies', icon: Building2 },
      { href: '/admin/users', label: 'Users', icon: Users },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: FolderKanban,
    items: [
      { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
      { href: '/admin/tickets', label: 'Tickets', icon: Ticket },
      { href: '/admin/services', label: 'Services (offered)', icon: Package },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    items: [
      { href: '/admin/invoices', label: 'Invoices', icon: FileText },
      { href: '/admin/invoices/recurring', label: 'Recurring', icon: Repeat },
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: Layout,
    items: [
      { href: '/admin/cms', label: 'Pages', icon: Layout },
      { href: '/admin/blog', label: 'Blog', icon: Newspaper },
      { href: '/admin/media', label: 'Media', icon: ImageIcon },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Briefcase,
    items: [
      { href: '/admin/content/services', label: 'Services', icon: Package },
      { href: '/admin/content/products', label: 'Products', icon: FolderOpen },
      { href: '/admin/content/portfolio', label: 'Portfolio', icon: Briefcase },
      { href: '/admin/content/case-studies', label: 'Case Studies', icon: FileText },
      { href: '/admin/content/team', label: 'Team', icon: Users2 },
      { href: '/admin/content/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
      { href: '/admin/content/faqs', label: 'FAQs', icon: HelpCircle },
      { href: '/admin/content/values', label: 'Values', icon: Heart },
      { href: '/admin/content/process-steps', label: 'Process', icon: ListOrdered },
      { href: '/admin/content/stats', label: 'Stats', icon: BarChart3 },
      { href: '/admin/content/partners', label: 'Partners', icon: Handshake },
    ],
  },
  {
    id: 'structure',
    label: 'Structure',
    icon: ListOrdered,
    items: [
      { href: '/admin/menus', label: 'Menus', icon: ListOrdered },
      { href: '/admin/redirects', label: 'Redirects', icon: Repeat },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    items: [
      { href: '/admin/settings/site', label: 'Site Settings', icon: Settings },
      { href: '/admin/settings/api-keys', label: 'API Keys', icon: Plug },
      { href: '/admin/integrations', label: 'Integrations', icon: Plug },
    ],
  },
]

const ADMIN_ROLES = ['ADMIN', 'SUPPORT', 'PM', 'FINANCE', 'CONTENT_EDITOR']

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-open the group containing the active path; accordion-style (only one)
  const initialOpenGroup = navGroups.find((g) =>
    g.items.some((it) => pathname === it.href || pathname.startsWith(it.href + '/'))
  )?.id ?? null
  const [openGroup, setOpenGroup] = useState<string | null>(initialOpenGroup)

  // Re-sync the open group on route change (when user navigates via Cmd+K etc.)
  useEffect(() => {
    const match = navGroups.find((g) =>
      g.items.some((it) => pathname === it.href || pathname.startsWith(it.href + '/'))
    )
    if (match) setOpenGroup(match.id)
  }, [pathname])

  function toggleGroup(id: string) {
    setOpenGroup((cur) => (cur === id ? null : id))
  }

  function isItemActive(href: string): boolean {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          router.push('/login')
          return
        }
        const data = await res.json()
        
        // Check if user has admin role
        const hasAdminRole = data.user.roles?.some((role: string) => 
          ADMIN_ROLES.includes(role)
        )
        
        if (!hasAdminRole) {
          router.push('/portal')
          return
        }
        
        setUser(data.user)
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <CommandPalette />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 text-white transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700">
          <Link href="/admin" className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="McAforo" 
              width={36} 
              height={36}
              className="rounded-full"
            />
            <span className="font-semibold text-lg">McAforo Admin</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-slate-800"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem-5rem)]">
          {topLevelItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isItemActive(item.href)
                  ? 'bg-primary text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}

          {navGroups.map((group) => {
            const isOpen = openGroup === group.id
            const groupHasActive = group.items.some((it) => isItemActive(it.href))
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    groupHasActive
                      ? 'text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <group.icon className="h-5 w-5" />
                    {group.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isOpen ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="ml-3 mt-1 space-y-0.5 border-l border-slate-700 pl-3">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors',
                          isItemActive(item.href)
                            ? 'bg-primary text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.roles?.join(', ')}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              3
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <span className="hidden md:inline-block">
                  {user.firstName} {user.lastName}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
