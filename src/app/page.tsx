import { redirect } from 'next/navigation'
import { getSessionUser, ADMIN_EMAIL } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getSessionUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role === 'ADMIN' && user.email.toLowerCase() === ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  if (user.role === 'PATIENT') {
    redirect('/paciente')
  }

  redirect('/login')
}
