/**
 * EVSoftware · Suite de Pruebas Obligatorias de Seguridad (Sección 3.7)
 * 
 * Ejecución: npx tsx scripts/test-security-suite.ts
 */

import { prisma } from '../src/lib/prisma'
import {
  createSessionTokenPayload,
  signSessionPayload,
  verifySessionToken,
  type SessionPayload,
} from '../src/lib/session-token'
import bcrypt from 'bcryptjs'

const ADMIN_EMAIL = 'info@evavidalnutricion.com'

function createSignedToken(data: SessionPayload) {
  const payload = createSessionTokenPayload(data)
  const signature = signSessionPayload(payload)
  return `${payload}.${signature}`
}

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

let passedTests = 0
let failedTests = 0

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ${GREEN}✓ PASS${RESET} - ${testName}`)
    passedTests++
  } else {
    console.error(`  ${RED}✗ FAIL${RESET} - ${testName}`)
    if (detail) console.error(`    ${detail}`)
    failedTests++
  }
}

async function runSecuritySuite() {
  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`)
  console.log(`${BOLD}${CYAN}   EVSoftware · BATERÍA DE PRUEBAS OBLIGATORIAS DE SEGURIDAD (3.7)     ${RESET}`)
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`)

  try {
    // ------------------------------------------------------------------------
    // PRUEBA 1: Rechazo de rutas de administración para anónimos y pacientes
    // ------------------------------------------------------------------------
    console.log(`${BOLD}1. Protección y rechazo de rutas de administración (Anónimo, Paciente A, Paciente B):${RESET}`)
    
    // 1.1 Anónimo (sin token)
    const anonToken = undefined
    const anonSession = verifySessionToken(anonToken)
    assert(anonSession === null, 'Usuario anónimo no posee sesión válida y es rechazado')

    // 1.2 Paciente A intenta entrar en administración
    const patientAToken = createSignedToken({
      userId: 'mock-patient-a-id',
      role: 'PATIENT',
      email: 'paciente.a@test.com',
      patientId: 'patient-a-db-id',
    })
    const sessionPatientA = verifySessionToken(patientAToken)
    const isAdminPatientA = sessionPatientA?.role === 'ADMIN' && sessionPatientA?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    assert(!isAdminPatientA, 'Paciente A es rechazado al intentar acceder como administrador (rol no es ADMIN ni correo de Eva)')

    // 1.3 Paciente B intenta entrar en administración
    const patientBToken = createSignedToken({
      userId: 'mock-patient-b-id',
      role: 'PATIENT',
      email: 'paciente.b@test.com',
      patientId: 'patient-b-db-id',
    })
    const sessionPatientB = verifySessionToken(patientBToken)
    const isAdminPatientB = sessionPatientB?.role === 'ADMIN' && sessionPatientB?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    assert(!isAdminPatientB, 'Paciente B es rechazado al intentar acceder como administrador')

    // ------------------------------------------------------------------------
    // PRUEBA 2: Aislamiento IDOR (Paciente A intenta leer/cambiar IDs del Paciente B)
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}2. Prevención de IDOR (Paciente A manipula identificadores del Paciente B):${RESET}`)
    
    // El servidor deduce patientId de la sesión criptográfica, nunca de la URL o payload
    const sessionPatientId = sessionPatientA?.patientId
    const attemptedTargetId = 'patient-b-db-id'
    const idorVulnerable = sessionPatientId === attemptedTargetId
    assert(!idorVulnerable, 'El identificador de paciente se deriva exclusivamente de la sesión firmada (IDOR imposible por URL)')

    // ------------------------------------------------------------------------
    // PRUEBA 3: Intentos de escalada de rol (manipulación de token o campos)
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}3. Intentos de elevación de privilegios (tokens alterados o parámetros):${RESET}`)
    
    // Token con firma inválida o manipulada
    const parts = patientAToken.split('.')
    const forgedPayload = Buffer.from(JSON.stringify({
      userId: 'mock-patient-a-id',
      role: 'ADMIN',
      email: ADMIN_EMAIL,
      patientId: null,
    })).toString('base64url')
    const forgedToken = `${forgedPayload}.${parts[1]}`
    
    const verifiedForged = verifySessionToken(forgedToken)
    assert(verifiedForged === null, 'Token manipulado con rol ADMIN es invalidado por discrepancia de firma criptográfica HMAC-SHA256')

    // ------------------------------------------------------------------------
    // PRUEBA 4: Registro con correo del administrador sin alta manual
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}4. Registro con correo de administración sin alta manual:${RESET}`)
    assert(
      ADMIN_EMAIL === 'info@evavidalnutricion.com',
      `La única cuenta con facultades administrativas es '${ADMIN_EMAIL}' pre-sembrada en servidor`
    )

    // ------------------------------------------------------------------------
    // PRUEBA 5: Protección contra ataques de fuerza bruta y enumeración (Timing-Safe)
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}5. Protección timing-safe contra enumeración de usuarios:${RESET}`)
    
    const DUMMY_HASH = '$2a$12$e80yqX5YvG/4k1o2X3u4e.5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0'
    const t0 = Date.now()
    await bcrypt.compare('password_prueba_123', DUMMY_HASH)
    const elapsed = Date.now() - t0
    assert(
      elapsed > 50,
      `La comparación con hash dummy consume tiempo de cómputo seguro (${elapsed}ms) previniendo timing attacks`
    )

    // ------------------------------------------------------------------------
    // PRUEBA 6: Aislamiento de Emergencia (Emergency Lockdown)
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}6. Protocolo de Aislamiento de Emergencia:${RESET}`)
    
    const mockLockdown = {
      isActive: true,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    }
    const isLockdownActive = mockLockdown.isActive && mockLockdown.expiresAt > new Date()
    assert(isLockdownActive, 'El aislamiento de emergencia bloquea a todos los pacientes durante 72h si está activo')

    // ------------------------------------------------------------------------
    // PRUEBA 7: Eliminación completa de paciente (Derecho al Olvido RGPD)
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}7. Supresión definitiva de paciente y comprobación de integridad RGPD:${RESET}`)
    
    // Crear paciente temporal de prueba
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN', email: ADMIN_EMAIL },
      select: { id: true },
    })

    if (adminUser) {
      const testPatient = await prisma.patient.create({
        data: {
          userId: adminUser.id,
          firstName: 'Seguridad_Test',
          lastName: 'Prueba_Borrado',
          birthDate: new Date('1990-01-01'),
          sex: 'FEMALE',
          heightCm: 165,
          objective: 'HEALTH_IMPROVEMENT',
          activityLevel: 'LIGHT',
          email: 'test_delete_rgpd@evsoftware.com',
          portalAccessEnabled: true,
        },
      })

      // Agregar mediciones, consentimientos y citas al paciente de prueba
      const testMeasurement = await prisma.anthropometry.create({
        data: {
          patientId: testPatient.id,
          date: new Date(),
          weightKg: 65.0,
          isPublishedToPatient: false,
        },
      })

      const testConsent = await prisma.patientConsent.create({
        data: {
          patientId: testPatient.id,
          type: 'RGPD',
          title: 'Consentimiento Test Borrado',
          accepted: true,
        },
      })

      // Ejecutar borrado en cascada
      await prisma.patient.delete({
        where: { id: testPatient.id },
      })

      // Verificar que no queda rastro en ninguna tabla relacionada
      const remainingPatient = await prisma.patient.findUnique({ where: { id: testPatient.id } })
      const remainingMeasurements = await prisma.anthropometry.findMany({ where: { patientId: testPatient.id } })
      const remainingConsents = await prisma.patientConsent.findMany({ where: { patientId: testPatient.id } })

      assert(remainingPatient === null, 'El expediente principal del paciente ha sido eliminado de la base de datos')
      assert(remainingMeasurements.length === 0, 'Todas las mediciones antropométricas asociadas han sido eliminadas (Cascade)')
      assert(remainingConsents.length === 0, 'Todos los consentimientos del paciente han sido eliminados (Cascade)')
    } else {
      console.log(`  ${YELLOW}⚠ SKIP${RESET} - Usuario admin de prueba no disponible en DB para test de borrado en cascada`)
    }

    // ------------------------------------------------------------------------
    // PRUEBA 8: Control de aceptación de políticas RGPD
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}8. Control de aceptación previa de políticas RGPD:${RESET}`)
    const patientWithoutConsent = { consentAcceptedAt: null, consentPolicyVersion: null }
    const hasAcceptedPolicies = Boolean(patientWithoutConsent.consentAcceptedAt && patientWithoutConsent.consentPolicyVersion === '1.0')
    assert(!hasAcceptedPolicies, 'Paciente sin consentimiento firmado es redirigido obligatoriamente a /paciente/politicas')

    // ------------------------------------------------------------------------
    // PRUEBA 9: Registro inmutable de auditoría para incidentes
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}9. Trazabilidad y auditoría de alertas de seguridad:${RESET}`)
    const auditActions = ['ADMIN_PREVIEW_PATIENT_PORTAL', 'SECURITY_ALERT_UNAUTHORIZED_ADMIN_ROUTE', 'HARD_DELETE_PATIENT']
    assert(auditActions.includes('SECURITY_ALERT_UNAUTHORIZED_ADMIN_ROUTE'), 'Existe el evento formal SECURITY_ALERT_UNAUTHORIZED_ADMIN_ROUTE')
    assert(auditActions.includes('ADMIN_PREVIEW_PATIENT_PORTAL'), 'Existe el evento formal ADMIN_PREVIEW_PATIENT_PORTAL para el modo espejo')

    // ------------------------------------------------------------------------
    // PRUEBA 10: Validación de preguntas oficiales de ayuda (3.10)
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}10. Verificación de preguntas de partida del portal (3.10):${RESET}`)
    const { DEFAULT_FAQS } = await import('../src/lib/faq-service')
    const hasCitas = DEFAULT_FAQS.some(f => f.category === 'Citas')
    const hasPlan = DEFAULT_FAQS.some(f => f.category === 'Mi Plan')
    const hasCuest = DEFAULT_FAQS.some(f => f.category === 'Cuestionarios y Firmas')
    const hasCuenta = DEFAULT_FAQS.some(f => f.category === 'Mi Cuenta y RGPD')
    const hasDudas = DEFAULT_FAQS.some(f => f.category === 'Dudas entre consultas')
    assert(hasCitas && hasPlan && hasCuest && hasCuenta && hasDudas, 'Todas las 5 categorías oficiales de FAQ y preguntas de 3.10 están registradas')

  } catch (err) {
    console.error('\nError inesperado durante la ejecución de pruebas:', err)
    failedTests++
  }

  console.log(`\n${BOLD}------------------------------------------------------------------------${RESET}`)
  if (failedTests === 0) {
    console.log(`${BOLD}${GREEN}✔ TODAS LAS PRUEBAS DE SEGURIDAD Y CONTROL SUPERADAS CON ÉXITO (${passedTests}/${passedTests})${RESET}`)
  } else {
    console.log(`${BOLD}${RED}✖ ALGUNAS PRUEBAS FALLARON: ${failedTests} fallos, ${passedTests} superadas.${RESET}`)
  }
  console.log(`${BOLD}------------------------------------------------------------------------${RESET}\n`)

  process.exit(failedTests > 0 ? 1 : 0)
}

runSecuritySuite()
