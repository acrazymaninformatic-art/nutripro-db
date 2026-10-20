import Link from 'next/link'
import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, FolderOpen, ArrowLeft, Calendar, Download, MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, { label: string; badgeClass: string }> = {
  ANALYSIS: { label: 'Analítica Clínica', badgeClass: 'bg-blue-100 text-blue-800' },
  MEDICAL_REPORT: { label: 'Informe Médico', badgeClass: 'bg-blue-100 text-blue-800' },
  BODY_COMP: { label: 'Composición Corporal', badgeClass: 'bg-purple-100 text-purple-800' },
  DIET_HISTORY: { label: 'Historial Dietético', badgeClass: 'bg-amber-100 text-amber-800' },
  OTHER: { label: 'Documento General', badgeClass: 'bg-gray-100 text-gray-800' },
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function PacienteDocumentosPage() {
  const { user, patientId: authPatientId, isAdminPreview } = await requirePatient()

  let patientId = authPatientId
  if (!patientId && isAdminPreview) {
    const firstPatient = await prisma.patient.findFirst({ select: { id: true } })
    patientId = firstPatient?.id || null
  }

  const [documents, consultations] = await Promise.all([
    patientId
      ? prisma.patientDocument.findMany({
          where: {
            patientId,
            isSharedWithPatient: true,
          },
          orderBy: { uploadedAt: 'desc' },
        })
      : [],
    patientId
      ? prisma.consultation.findMany({
          where: {
            patientId,
            isSharedWithPatient: true,
          },
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            notes: true,
            planNotes: true,
          },
        })
      : [],
  ])

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/paciente"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white glass-card p-6 sm:p-7 rounded-3xl border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-2xs">
              <FolderOpen className="w-5 h-5" />
            </div>
            <span>Documentos Clínicos y Notas de Eva</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Informes, analíticas y pautas compartidas por tu nutricionista Eva Vidal
          </p>
        </div>
      </div>

      {/* NOTAS DE CONSULTA PARA EL PACIENTE (PDF pág 3 y 8) */}
      {consultations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Notas Clínicas de Consulta para el Paciente ({consultations.length})</span>
          </h2>

          <div className="space-y-3">
            {consultations.map((c) => (
              <Card key={c.id} className="glass-card rounded-3xl border-blue-100/90 bg-white shadow-2xs p-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                  <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 font-sans" />
                    <span>Consulta del {formatDate(c.date)}</span>
                  </span>
                  <Badge variant="default" className="text-3xs font-bold rounded-full">
                    Compartido por Eva
                  </Badge>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-normal">
                  {c.planNotes || c.notes}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* DOCUMENTOS / ARCHIVOS ADJUNTOS */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-purple-600" />
          <span>Archivos y Documentos ({documents.length})</span>
        </h2>

        {documents.length === 0 ? (
          <Card className="text-center py-16 px-6 border-dashed border-2 border-slate-200 rounded-3xl bg-white/70 shadow-xs backdrop-blur-xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No hay documentos compartidos todavía</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Aquí se mostrarán las analíticas clínicas, informes de evolución o materiales educativos
              que Eva Vidal comparta contigo a lo largo de tus consultas.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => {
              const docName = doc.title || doc.fileName || 'Documento'
              const catInfo = CATEGORY_LABELS[doc.category] || {
                label: doc.category || 'Documento',
                badgeClass: 'bg-slate-100 text-slate-800',
              }

              return (
                <Card
                  key={doc.id}
                  className="glass-card glass-card-hover rounded-3xl border-slate-200/80 bg-white flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <FileText className="w-4 h-4" />
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold border-0 rounded-full ${catInfo.badgeClass}`}
                      >
                        {catInfo.label}
                      </Badge>
                    </div>

                    <CardTitle
                      className="text-sm font-bold text-gray-900 line-clamp-2"
                      title={docName}
                    >
                      {docName}
                    </CardTitle>

                    {doc.notes && (
                      <CardDescription className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {doc.notes}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="border-t border-gray-100 pt-3 mt-1 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDate(doc.uploadedAt)}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs transition-all shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Ver / Descargar</span>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
