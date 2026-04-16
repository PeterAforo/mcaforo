import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center">
          <Link href="/" className="text-xl font-bold text-primary">
            McAforo
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center py-12">
        {children}
      </main>
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} McAforo. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
