'use client'

import {
  Archive,
  Check,
  Clock3,
  Copy,
  FileStack,
  History,
  RotateCcw,
  RotateCw,
  Save,
  Trash2,
} from 'lucide-react'
import { STATUS_LABELS, type MenuStatus } from '@/lib/menu-config'

export interface MenuDataState {
  title: string
  status: MenuStatus
  startDate: string
  endDate: string
  internalNotes: string
  isTemplate: boolean
}

interface MenuDataTabProps {
  data: MenuDataState
  internalCode: string
  onChange: (patch: Partial<MenuDataState>) => void
  versions: Array<{ id: string; version: number; summary: string | null; createdAt: string }>
  onRestoreVersion: (versionId: string) => void
  onDuplicate: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  saveLabel: string
  isSaving: boolean
}

const fieldClass =
  'h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'

export function MenuDataTab({
  data,
  internalCode,
  onChange,
  versions,
  onRestoreVersion,
  onDuplicate,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveLabel,
  isSaving,
}: MenuDataTabProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Datos</h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-gray-600">Título del menú</span>
            <input
              type="text"
              value={data.title}
              onChange={(event) => onChange({ title: event.target.value })}
              className={fieldClass}
              placeholder="Ej: Pauta metabólica fase 1"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-gray-600">Código interno</span>
            <input
              type="text"
              value={internalCode}
              readOnly
              className={`${fieldClass} bg-gray-50 font-mono text-[11px] text-gray-500`}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-gray-600">Estado</span>
            <select
              value={data.status}
              onChange={(event) => onChange({ status: event.target.value as MenuStatus })}
              className={fieldClass}
            >
              <option value="DRAFT">{STATUS_LABELS.DRAFT}</option>
              <option value="ACTIVE">{STATUS_LABELS.ACTIVE}</option>
              <option value="ARCHIVED">{STATUS_LABELS.ARCHIVED}</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-gray-600">Fecha de inicio</span>
              <input
                type="date"
                value={data.startDate}
                onChange={(event) => onChange({ startDate: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-gray-600">Fecha de fin</span>
              <input
                type="date"
                value={data.endDate}
                onChange={(event) => onChange({ endDate: event.target.value })}
                className={fieldClass}
              />
            </label>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold text-gray-600">Notas internas</span>
          <textarea
            value={data.internalNotes}
            onChange={(event) => onChange({ internalNotes: event.target.value })}
            rows={3}
            placeholder="Observaciones para la consulta (no visibles para el paciente)…"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
        <button
          type="button"
          onClick={onDuplicate}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700"
        >
          <Copy className="h-3.5 w-3.5" />
          Duplicar menú
        </button>

        <button
          type="button"
          onClick={() => onChange({ isTemplate: !data.isTemplate })}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-colors ${
            data.isTemplate
              ? 'border-amber-400 bg-amber-50 text-amber-900'
              : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-800'
          }`}
        >
          <FileStack className="h-3.5 w-3.5" />
          {data.isTemplate ? 'Guardado como plantilla' : 'Guardar como plantilla'}
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Deshacer (Ctrl + Z)"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Rehacer (Ctrl + Shift + Z)"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <span className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-[10px] font-bold text-gray-500">
            {isSaving ? (
              <>
                <Clock3 className="h-3 w-3 animate-spin" />
                Guardando…
              </>
            ) : (
              <>
                <Save className="h-3 w-3 text-emerald-600" />
                {saveLabel}
              </>
            )}
          </span>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
          <History className="h-3.5 w-3.5" />
          Historial de versiones
        </h3>

        {versions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-300 bg-white/70 px-4 py-6 text-center text-xs font-semibold text-gray-500">
            Todavía no hay versiones guardadas.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {versions.map((version) => (
              <li
                key={version.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-black text-gray-600">
                  v{version.version}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-gray-800">
                    {version.summary || 'Autoguardado'}
                  </p>
                  <p className="text-[10px] font-semibold text-gray-400">
                    {new Date(version.createdAt).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRestoreVersion(version.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-bold text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-700"
                >
                  <Archive className="h-3 w-3" />
                  Restaurar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
        <Check className="h-3 w-3 text-emerald-600" />
        Los cambios se guardan automáticamente. Puedes deshacerlos con Ctrl + Z.
        <Trash2 className="ml-1 h-3 w-3 text-gray-300" />
      </p>
    </div>
  )
}
