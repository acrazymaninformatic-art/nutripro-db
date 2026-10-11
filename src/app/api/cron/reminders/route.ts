import { NextResponse } from 'next/server'
import { sendUpcomingReminders24h } from '@/app/dashboard/appointments/actions'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await sendUpcomingReminders24h()
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: any) {
    console.error('Error executing automated reminders:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error executing reminders' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return GET()
}
