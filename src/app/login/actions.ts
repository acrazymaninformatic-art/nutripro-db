'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, destroySession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export interface LoginState {
  error?: string
}

export async function login(_previousState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  if (!email || !password) return { error: 'Correo o contraseña incorrectos.' }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
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

  if (!user || user.passwordChangeRequired || !(await bcrypt.compare(password, user.passwordHash))) {
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

    await createSession(user.id)
    redirect('/paciente')
  }

  await createSession(user.id)
  redirect('/dashboard')
}

export async function logout() {
  await destroySession()
  redirect('/login')
}
