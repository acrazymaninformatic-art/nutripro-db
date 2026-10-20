import { Skeleton } from '@/components/ui/skeleton'

export default function PatientPortalLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in" aria-label="Cargando portal" role="status">
      <div className="rounded-3xl border border-blue-100 bg-white/80 p-6 shadow-sm sm:p-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-9 w-80 max-w-full" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Skeleton className="h-40 rounded-3xl md:col-span-2" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
      <Skeleton className="h-72 rounded-3xl" />
      <span className="sr-only">Cargando contenido del portal…</span>
    </div>
  )
}
