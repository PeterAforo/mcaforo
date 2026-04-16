'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Building2, Mail, Phone, Globe } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Company {
  id: string
  name: string
  email: string | null
  phone: string | null
  website: string | null
  _count: {
    projects: number
    invoices: number
    tickets: number
  }
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch('/api/admin/companies')
        if (res.ok) {
          const data = await res.json()
          setCompanies(data.companies || [])
        }
      } catch (error) {
        console.error('Failed to fetch companies:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [])

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(search.toLowerCase()) ||
    company.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground mt-1">
            Manage client companies
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/companies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCompanies.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No companies found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  {company.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {company.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {company.email}
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {company.phone}
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    {company.website}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Badge variant="outline">{company._count?.projects || 0} Projects</Badge>
                  <Badge variant="outline">{company._count?.invoices || 0} Invoices</Badge>
                  <Badge variant="outline">{company._count?.tickets || 0} Tickets</Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                  <Link href={`/admin/companies/${company.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
