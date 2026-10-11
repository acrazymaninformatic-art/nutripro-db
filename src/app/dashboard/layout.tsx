import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 print:h-auto print:overflow-visible print:bg-white print:block">
      <div className="print:hidden">
        <Sidebar />
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
