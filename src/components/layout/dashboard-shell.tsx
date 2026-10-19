'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { PageMotion } from '@/components/ui/page-motion'

export function DashboardShell({
  professionalName,
  children,
}: {
  professionalName: string
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-ambient-eva print:h-auto print:overflow-visible print:bg-white print:block">
      <div className="print:hidden">
        <Sidebar
          professionalName={professionalName}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden print:h-auto print:overflow-visible print:block">
        <div className="print:hidden">
          <Header onMenu={() => setMobileMenuOpen(true)} />
        </div>
        <main className="surface-grid flex-1 overflow-y-auto bg-transparent p-4 sm:p-6 print:m-0 print:h-auto print:overflow-visible print:bg-white print:block print:p-0">
          <div className="page-shell">
            <PageMotion>{children}</PageMotion>
          </div>
        </main>
      </div>
    </div>
  )
}
