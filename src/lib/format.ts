const dateTime = new Intl.DateTimeFormat('hu-HU', { month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })
const relative = new Intl.RelativeTimeFormat('hu-HU', { numeric: 'auto' })

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso))
}

export function timeAgo(iso: string) {
  const s = (new Date(iso).getTime() - Date.now()) / 1000
  if (s > -60) return 'most'
  if (s > -3600) return relative.format(Math.round(s / 60), 'minute')
  if (s > -86400) return relative.format(Math.round(s / 3600), 'hour')
  return relative.format(Math.round(s / 86400), 'day')
}
