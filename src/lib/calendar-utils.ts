/**
 * @file calendar-utils.ts
 * @description Client-safe Google Calendar URL and ICS generator utilities.
 * This file has ZERO Node.js dependencies and can be safely imported in 'use client' components.
 */

function formatGoogleCalendarDate(d: Date): string {
  return d.toISOString().replace(/-|:|\.\d{3}/g, '')
}

export function generateGoogleCalendarUrl({
  title,
  startDate,
  durationMin = 45,
  description,
  location,
}: {
  title: string
  startDate: Date
  durationMin?: number
  description: string
  location: string
}): string {
  const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000)
  const startIso = formatGoogleCalendarDate(startDate)
  const endIso = formatGoogleCalendarDate(endDate)

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`
}

export function generateIcsContent({
  title,
  startDate,
  durationMin = 45,
  description,
  location,
}: {
  title: string
  startDate: Date
  durationMin?: number
  description: string
  location: string
}): string {
  const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000)
  const startIso = formatGoogleCalendarDate(startDate)
  const endIso = formatGoogleCalendarDate(endDate)
  const nowIso = formatGoogleCalendarDate(new Date())

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NutriPro Eva Vidal//Consulta Nutricional//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:nutripro-${Date.now()}@nutripro.com`,
    `DTSTAMP:${nowIso}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
