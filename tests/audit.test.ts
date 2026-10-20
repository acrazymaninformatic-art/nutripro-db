import { describe, expect, it } from 'vitest'
import { buildAuditWhere, parseAuditFilters, toCsvValue } from '@/lib/audit'

describe('filtros del visor de auditoría', () => {
  it('normaliza los parámetros de la URL', () => {
    const filters = parseAuditFilters({ q: '  cita  ', entity: 'PATIENT', page: '3' })

    expect(filters.q).toBe('cita')
    expect(filters.entity).toBe('PATIENT')
    expect(filters.page).toBe(3)
  })

  it('usa la página 1 cuando no se indica', () => {
    expect(parseAuditFilters({}).page).toBe(1)
    expect(parseAuditFilters({ page: 'abc' }).page).toBe(1)
  })

  it('limita la consulta a la actividad propia y a la de los pacientes propios', () => {
    const where = buildAuditWhere('user-1', parseAuditFilters({}))

    expect(where.OR).toEqual([{ userId: 'user-1' }, { patient: { userId: 'user-1' } }])
  })

  it('añade condiciones de entidad, acción y fechas', () => {
    const where = buildAuditWhere(
      'user-1',
      parseAuditFilters({ entity: 'PATIENT', action: 'X', from: '2026-01-01', to: '2026-02-01' })
    )

    const conditions = (where.AND || []) as Record<string, unknown>[]
    expect(conditions.length).toBe(4)
    expect(conditions[0]).toEqual({ entityType: 'PATIENT' })
    expect(conditions[1]).toEqual({ action: 'X' })
  })

  it('busca por acción, detalle o paciente', () => {
    const where = buildAuditWhere('user-1', parseAuditFilters({ q: 'María' }))

    const conditions = (where.AND || []) as Record<string, unknown>[]
    expect(conditions).toHaveLength(1)
    expect(JSON.stringify(conditions[0])).toContain('OR')
  })
})

describe('exportación CSV', () => {
  it('entrecomilla los valores con separadores o comillas', () => {
    expect(toCsvValue('texto')).toBe('texto')
    expect(toCsvValue('con;punto y coma')).toBe('"con;punto y coma"')
    expect(toCsvValue('con "comillas"')).toBe('"con ""comillas"""')
  })

  it('convierte null y undefined en cadena vacía', () => {
    expect(toCsvValue(null)).toBe('')
    expect(toCsvValue(undefined)).toBe('')
  })
})
