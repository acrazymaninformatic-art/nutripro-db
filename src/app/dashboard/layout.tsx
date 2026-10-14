import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { requireAdmin } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 print:h-auto print:overflow-visible print:bg-white print:block">
      <div className="print:hidden">
        <Sidebar professionalName={user.name} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 print:h-auto print:overflow-visible print:block">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 print:p-0 print:m-0 print:h-auto print:overflow-visible print:bg-white print:block">
          {children}
        </main>
      </div>
    </div>
  )
}
