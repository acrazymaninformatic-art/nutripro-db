import { permanentRedirect, redirect } from 'next/navigation'
import { getSessionUser, ADMIN_EMAIL } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getSessionUser()

  if (!user) {
    // La web pública es la portada del dominio; el acceso clínico va aparte.
    permanentRedirect('/servicios')
  }

  if (user.role === 'ADMIN' && user.email.toLowerCase() === ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  if (user.role === 'PATIENT') {
    redirect('/paciente')
  }

  redirect('/login')
}
