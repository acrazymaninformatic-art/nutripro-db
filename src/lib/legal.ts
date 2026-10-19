export const LEGAL_POLICY_VERSION = '2026-10-19'

/**
 * Datos jurídicos que deben completarse antes de presentar la aplicación como
 * servicio público. No se rellenan con datos inventados.
 */
export const LEGAL_PROFILE = {
  legalName: 'Eva Maria Vidal Garcia',
  tradeName: 'Eva Vidal Nutrición',
  email: 'info@evavidalnutricion.com',
  phone: '644137667',
  nif: '',
  professionalCollege: '',
  professionalNumber: '1222',
  professionalAddress: '',
  dpoName: '',
  dpoEmail: '',
} as const

export const LEGAL_PROFILE_MISSING_FIELDS = [
  !LEGAL_PROFILE.nif ? 'NIF' : null,
  !LEGAL_PROFILE.professionalAddress ? 'domicilio profesional completo' : null,
  !LEGAL_PROFILE.professionalCollege ? 'nombre oficial del colegio profesional' : null,
].filter((field): field is string => Boolean(field))

export const REQUIRED_PORTAL_CONSENTS = [
  {
    type: 'PRIVACY_NOTICE',
    title: 'Información de privacidad y protección de datos',
  },
  {
    type: 'PORTAL_TERMS',
    title: 'Condiciones de uso del portal clínico',
  },
  {
    type: 'HEALTH_DATA_PROCESSING',
    title: 'Tratamiento de datos de salud',
  },
] as const

export function isLegalProfileComplete() {
  return LEGAL_PROFILE_MISSING_FIELDS.length === 0
}

export function getForwardedClientAddress(value: string | null) {
  return value?.split(',')[0]?.trim().slice(0, 64) || 'no disponible'
}
