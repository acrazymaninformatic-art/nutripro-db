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
    <div
      className="flex h-screen flex-col overflow-hidden bg-ambient-eva print:h-auto print:overflow-visible print:bg-white print:block"
      data-gsap-portal="admin"
    >
      {/* Menú drawer lateral exclusivo para dispositivos móviles */}
      <div className="print:hidden">
        <Sidebar
          professionalName={professionalName}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Barra de navegación superior (Encabezado + Enlaces de navegación) */}
      <div className="print:hidden shrink-0 z-30" data-gsap-header>
        <Header
          professionalName={professionalName}
          onMenu={() => setMobileMenuOpen(true)}
        />
      </div>

      {/* Contenido principal a ancho completo sin barra lateral izquierda */}
      <main
        className="surface-grid flex-1 overflow-auto bg-transparent p-2 sm:p-4 lg:p-4 print:m-0 print:h-auto print:overflow-visible print:bg-white print:block print:p-0"
        data-gsap-scroll="admin"
      >
        <div className="page-shell w-full">
          <PageMotion>{children}</PageMotion>
        </div>
      </main>
    </div>
  )
}
