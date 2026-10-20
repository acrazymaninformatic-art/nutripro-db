'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Siren,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import type { AllergenPolicy, MenuPatientProfile } from '@/lib/menu-config'
import { objectiveLabel } from '@/lib/menu-config'

export interface PatientOption {
  id: string
  firstName: string
  lastName: string
  email: string | null
  weightKg: number | null
  heightCm: number | null
  birthDate: string | null
  sex: string | null
  objective: string | null
  allergies: string | null
  intolerances: string | null
  dietaryPreferences: string | null
  foodAversions: string | null
  activityLevel: string | null
}

export interface MenuAssignment {
  id: string
  patientId: string
  servings: number
  profile: Record<string, unknown>
  patient: { id: string; firstName: string; lastName: string; email: string | null }
}

interface MenuPatientsTabProps {
  patients: PatientOption[]
  assignments: MenuAssignment[]
  allergenPolicy: AllergenPolicy
  onPolicyChange: (policy: AllergenPolicy) => void
  onAssign: (patient: PatientOption, servings: number) => void
  onRemove: (patientId: string) => void
  onServingsChange: (patientId: string, servings: number) => void
  onReimport: (patient: PatientOption) => void
  conflictsByPatient: Record<string, string[]>
}

const POLICY_LABELS: Record<AllergenPolicy, string> = {
  BLOCK: 'Bloquear la asignación si hay alérgenos sin resolver',
  CONFIRM: 'Pedir confirmación si hay alérgenos sin resolver',
  WARN: 'Mostrar aviso sin bloquear',
}

export function MenuPatientsTab({
  patients,
  assignments,
  allergenPolicy,
  onPolicyChange,
  onAssign,
  onRemove,
  onServingsChange,
  onReimport,
  conflictsByPatient,
}: MenuPatientsTabProps) {
  const [search, setSearch] = useState('')
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({})

  const assignedIds = useMemo(
    () => new Set(assignments.map((assignment) => assignment.patientId)),
    [assignments]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return patients
    return patients.filter((patient) =>
      `${patient.firstName} ${patient.lastName} ${patient.email || ''}`.toLowerCase().includes(term)
    )
  }, [patients, search])

  const handleAssign = (patient: PatientOption) => {
    const conflicts = conflictsByPatient[patient.id] || []
    if (conflicts.length > 0 && allergenPolicy === 'BLOCK') return
    if (conflicts.length > 0 && allergenPolicy === 'CONFIRM' && !confirmed[patient.id]) return
    onAssign(patient, 1)
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
          <Users className="h-3.5 w-3.5" />
          Pacientes asignados
        </h3>

        {assignments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-300 bg-white/70 px-4 py-6 text-center text-xs font-semibold text-gray-500">
            Todavía no hay pacientes asignados a este menú.
          </p>
        ) : (
          <ul className="space-y-2">
            {assignments.map((assignment) => {
              const profile = (assignment.profile || {}) as unknown as MenuPatientProfile
              const conflicts = conflictsByPatient[assignment.patientId] || []
              const allergenList = (profile.allergies || '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
              const intoleranceList = (profile.intolerances || '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)

              return (
                <li key={assignment.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Users className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900">
                        {assignment.patient.firstName} {assignment.patient.lastName}
                      </p>
                      <p className="text-[10px] font-semibold text-gray-500">
                        {assignment.patient.email || 'Sin email'}
                      </p>
                    </div>

                    <label className="ml-auto flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Raciones
                      </span>
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={assignment.servings}
                        onChange={(event) =>
                          onServingsChange(assignment.patientId, Number(event.target.value))
                        }
                        className="h-7 w-16 rounded-lg border border-gray-200 bg-white px-2 text-right text-[11px] font-bold text-gray-800"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const patient = patients.find((item) => item.id === assignment.patientId)
                        if (patient) onReimport(patient)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-700"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reimportar ficha
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(assignment.patientId)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-700 transition-colors hover:bg-red-100"
                    >
                      <UserMinus className="h-3 w-3" />
                      Quitar
                    </button>
                  </div>

                  <dl className="mt-3 grid gap-x-4 gap-y-1.5 border-t border-gray-100 pt-3 sm:grid-cols-3">
                    <div>
                      <dt className="text-[9px] font-black uppercase tracking-wider text-gray-400">Peso</dt>
                      <dd className="text-[11px] font-bold text-gray-800">
                        {profile.weightKg ? `${profile.weightKg} kg` : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-black uppercase tracking-wider text-gray-400">Altura</dt>
                      <dd className="text-[11px] font-bold text-gray-800">
                        {profile.heightCm ? `${profile.heightCm} cm` : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-black uppercase tracking-wider text-gray-400">Edad</dt>
                      <dd className="text-[11px] font-bold text-gray-800">
                        {profile.age ? `${profile.age} años` : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-black uppercase tracking-wider text-gray-400">Sexo</dt>
                      <dd className="text-[11px] font-bold text-gray-800">
                        {profile.sex === 'MALE' ? 'Hombre' : profile.sex === 'FEMALE' ? 'Mujer' : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-black uppercase tracking-wider text-gray-400">Objetivo</dt>
                      <dd className="text-[11px] font-bold text-gray-800">
                        {objectiveLabel(profile.objective)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                        Alimentos que no le gustan
                      </dt>
                      <dd className="text-[11px] font-bold text-gray-800">
                        {profile.dislikedFoods || '—'}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 space-y-1.5">
                    {allergenList.length > 0 && (
                      <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-red-800">
                        <Siren className="h-3 w-3" />
                        Alergias: {allergenList.join(', ')}
                      </p>
                    )}
                    {intoleranceList.length > 0 && (
                      <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-amber-800">
                        <AlertTriangle className="h-3 w-3" />
                        Intolerancias: {intoleranceList.join(', ')}
                      </p>
                    )}
                    {profile.dietaryPreferences && (
                      <p className="text-[10px] font-bold text-gray-600">
                        Preferencias: {profile.dietaryPreferences}
                      </p>
                    )}
                    {conflicts.length > 0 && (
                      <ul className="space-y-1">
                        {conflicts.map((conflict) => (
                          <li
                            key={conflict}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-900"
                          >
                            {conflict}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <label className="block max-w-md">
          <span className="mb-1.5 block text-[11px] font-bold text-gray-600">
            Política de alérgenos sin resolver
          </span>
          <select
            value={allergenPolicy}
            onChange={(event) => onPolicyChange(event.target.value as AllergenPolicy)}
            className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
          >
            {Object.entries(POLICY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {allergenPolicy === 'BLOCK' && (
          <p className="flex items-center gap-1.5 text-[10px] font-bold text-red-700">
            <Ban className="h-3 w-3" />
            No se podrá asignar un paciente con alérgenos sin resolver.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
          Asignar paciente
        </h3>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar paciente…"
          className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 sm:max-w-xs"
        />

        <ul className="space-y-1.5">
          {filtered.map((patient) => {
            const isAssigned = assignedIds.has(patient.id)
            const conflicts = conflictsByPatient[patient.id] || []
            const blocked = conflicts.length > 0 && allergenPolicy === 'BLOCK'
            const needsConfirm =
              conflicts.length > 0 && allergenPolicy === 'CONFIRM' && !confirmed[patient.id]

            return (
              <li
                key={patient.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                <span className="text-[11px] font-bold text-gray-800">
                  {patient.firstName} {patient.lastName}
                </span>
                {patient.allergies && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-black text-red-700">
                    Alergias configuradas
                  </span>
                )}

                {isAssigned ? (
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Asignado
                  </span>
                ) : (
                  <div className="ml-auto flex items-center gap-2">
                    {needsConfirm && (
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800">
                        <input
                          type="checkbox"
                          checked={!!confirmed[patient.id]}
                          onChange={(event) =>
                            setConfirmed((state) => ({
                              ...state,
                              [patient.id]: event.target.checked,
                            }))
                          }
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Confirmo el riesgo
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAssign(patient)}
                      disabled={blocked || needsConfirm}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {blocked ? <ShieldAlert className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                      Asignar
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
