import { NextResponse } from 'next/server'
import { sendUpcomingReminders24h } from '@/app/dashboard/appointments/actions'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const result = await sendUpcomingReminders24h()
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error executing reminders'
    console.error('Error executing automated reminders:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return GET(request)
}
