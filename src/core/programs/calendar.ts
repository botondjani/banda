// Naptárba mentés: .ics fájl (telefon naptára) és Google Naptár link. Alapból 2 órás esemény.
type Ev = { id: string; title: string; starts_at: string; location: string | null }

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
const range = (ev: Ev) => {
  const start = new Date(ev.starts_at)
  return [start, new Date(start.getTime() + 2 * 3600_000)] as const
}

export function downloadIcs(ev: Ev, url: string) {
  const [start, end] = range(ev)
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Banda//HU', 'BEGIN:VEVENT',
    `UID:${ev.id}@banda`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(ev.title)}`, ev.location ? `LOCATION:${esc(ev.location)}` : '', `URL:${url}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  a.download = `${ev.title.replace(/[^\p{L}\p{N} -]/gu, '').trim() || 'program'}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export function googleCalendarUrl(ev: Ev, url: string) {
  const [start, end] = range(ev)
  const p = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates: `${stamp(start)}/${stamp(end)}`, details: url })
  if (ev.location) p.set('location', ev.location)
  return `https://calendar.google.com/calendar/render?${p}`
}
