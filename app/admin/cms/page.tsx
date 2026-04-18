'use client'

import Link from 'next/link'
import { Layout, FileText, MenuSquare, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const modules = [
  {
    href: '/admin/cms/menus',
    title: 'Menus',
    description: 'Manage header, footer, and other navigation menus',
    icon: MenuSquare,
  },
  {
    href: '/admin/cms/pages',
    title: 'Pages',
    description: 'Create and edit static pages with rich content',
    icon: FileText,
  },
  {
    href: '/admin/blog',
    title: 'Blog Posts',
    description: 'Manage blog posts and categories',
    icon: Layout,
  },
]

export default function CMSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Management</h1>
        <p className="text-muted-foreground mt-1">Manage your website content</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {modules.map((m) => (
          <Link key={m.href} href={m.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <m.icon className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">{m.title}</CardTitle>
                <CardDescription>{m.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
