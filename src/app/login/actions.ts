'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, destroySession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export interface LoginState {
  error?: string
}

// Hash de prueba constante para mitigar ataques de temporización (timing attack) y enumeración de usuarios
const DUMMY_HASH = '$2a$12$e80z94yq5eT83/g5xL2yeeuQG83v7e9K3i0y62y.47K6x/2mO.6Qy'

export async function login(_previousState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  if (!email || !password) return { error: 'Correo o contraseña incorrectos.' }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      passwordChangeRequired: true,
      role: true,
      patientId: true,
      patientAccount: {
        select: {
          id: true,
          portalAccessEnabled: true,
          isHardDeleted: true,
        },
      },
    },
  })

  // Ejecución en tiempo constante: si el usuario no existe, se ejecuta bcrypt contra DUMMY_HASH
  const hashToCompare = user?.passwordHash || DUMMY_HASH
  const passwordMatches = await bcrypt.compare(password, hashToCompare)

  if (!user || user.passwordChangeRequired || !passwordMatches) {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  // La vista de administración solo la usa evavidalinfo@gmail.com
  const { ADMIN_EMAIL } = await import('@/lib/auth')
  if (user.role === 'ADMIN' && user.email.toLowerCase() !== ADMIN_EMAIL) {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  if (user.role === 'PATIENT') {
    if (user.patientAccount?.isHardDeleted || user.patientAccount?.portalAccessEnabled === false) {
      return { error: 'El acceso a este portal ha sido desactivado.' }
    }

    const { isEmergencyLockdownActive } = await import('@/lib/auth')
    if (await isEmergencyLockdownActive()) {
      return { error: 'El portal está temporalmente en aislamiento preventivo por seguridad técnica. Por favor, inténtalo más tarde.' }
    }

    if (user.patientId) {
      await prisma.patient.update({
        where: { id: user.patientId },
        data: { portalLastLoginAt: new Date() },
      })
    }

    await createSession({
      id: user.id,
      role: user.role,
      email: user.email,
      patientId: user.patientId,
    })
    redirect('/paciente')
  }

  await createSession({
    id: user.id,
    role: user.role,
    email: user.email,
    patientId: user.patientId,
  })
  redirect('/dashboard')
}

export async function logout() {
  await destroySession()
  redirect('/login')
}
