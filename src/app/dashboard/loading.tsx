import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in" aria-label="Cargando panel" role="status">
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm sm:p-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-9 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-3xl" />
      <span className="sr-only">Cargando contenido del panel…</span>
    </div>
  )
}
