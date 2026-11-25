import { useRef, useState } from 'react'
import { useSession } from '../../../core/auth/auth'
import { useGroup } from '../../../core/groups/GroupProvider'
import { Button } from '../../../ui/Button'
import { Input } from '../../../ui/Input'
import { toast } from '../../../ui/Toast'
import { useSubmit, type Challenge } from '../api'
import { SubmissionCard } from './SubmissionCard'

function left(ends: string) {
  const h = Math.max(0, Math.round((new Date(ends).getTime() - Date.now()) / 3600_000))
  return h >= 48 ? `még ${Math.round(h / 24)} nap` : h > 0 ? `még ${h} óra` : 'lejárt'
}

export function ChallengeCard({ c }: { c: Challenge }) {
  const { group } = useGroup()
  const uid = useSession()!.user.id
  const submit = useSubmit(group.id, uid)
  const fileInput = useRef<HTMLInputElement>(null)
  const [note, setNote] = useState('')
  const active = new Date(c.ends_at).getTime() > Date.now()
  const mine = c.challenge_submissions.find((s) => s.user_id === uid)

  function onFile(file: File | undefined) {
    if (!file) return
    submit.mutate(
      { challenge: c, file, note: note.trim() || null },
      { onSuccess: () => toast.success('Beküldve. Most a többiek döntenek.'), onError: () => toast.error('Nem sikerült feltölteni.') },
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold">{c.title}</h2>
        {c.description && <p className="mt-1">{c.description}</p>}
        <p className="mt-1 text-sm text-muted">
          {c.creator?.display_name} kihívása · {left(c.ends_at)}
        </p>
      </div>

      {active && !mine && (
        <div className="flex flex-col gap-3">
          <Input label="Megjegyzés" placeholder="Nem kötelező" maxLength={140} value={note} onChange={(e) => setNote(e.target.value)} />
          <Button onClick={() => fileInput.current?.click()} disabled={submit.isPending}>
            {submit.isPending ? 'Feltöltés…' : 'Fotó a bizonyítékról'}
          </Button>
          <input ref={fileInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      )}

      {c.challenge_submissions.length === 0 ? (
        <p className="text-muted">Még senki nem küldött be semmit.</p>
      ) : (
        c.challenge_submissions.map((s) => <SubmissionCard key={s.id} s={s} />)
      )}
    </section>
  )
}
