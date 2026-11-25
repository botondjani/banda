import { CalendarPlus, Share2 } from 'lucide-react'
import { useState } from 'react'
import { formatDateTime } from '../../lib/format'
import { Button } from '../../ui/Button'
import { ListRow } from '../../ui/ListRow'
import { Sheet } from '../../ui/Sheet'
import { toast } from '../../ui/Toast'
import { downloadIcs, googleCalendarUrl } from './calendar'

type P = { id: string; title: string; starts_at: string | null; location: string | null }

export function ProgramActions({ program }: { program: P }) {
  const [calendar, setCalendar] = useState(false)
  const url = `${window.location.origin}${import.meta.env.BASE_URL}programs/${program.id}`
  const ev = program.starts_at ? { ...program, starts_at: program.starts_at } : null

  async function share() {
    const text = [program.title, program.starts_at && formatDateTime(program.starts_at), program.location].filter(Boolean).join(' · ')
    if (navigator.share) {
      await navigator.share({ title: program.title, text, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      toast.success('Kimásolva, mehet a chatbe.')
    }
  }

  return (
    <div className="flex gap-2">
      {ev && (
        <Button variant="secondary" className="min-h-10 flex-1 px-4 text-sm" onClick={() => setCalendar(true)}>
          <CalendarPlus size={18} strokeWidth={1.75} aria-hidden /> Naptárba
        </Button>
      )}
      <Button variant="secondary" className="min-h-10 flex-1 px-4 text-sm" onClick={share}>
        <Share2 size={18} strokeWidth={1.75} aria-hidden /> Megosztás
      </Button>
      {ev && (
        <Sheet open={calendar} onOpenChange={setCalendar} title="Naptárba mentés">
          <ListRow title="Telefon naptára" meta="Letöltés .ics fájlként, megnyitva hozzáadja" onClick={() => { downloadIcs(ev, url); setCalendar(false) }} />
          <ListRow title="Google Naptár" meta="Megnyitja a Google Naptárat" onClick={() => { window.open(googleCalendarUrl(ev, url), '_blank', 'noopener'); setCalendar(false) }} />
        </Sheet>
      )}
    </div>
  )
}
