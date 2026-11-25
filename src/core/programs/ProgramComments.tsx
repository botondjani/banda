import { SendHorizontal } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { timeAgo } from '../../lib/format'
import { Avatar } from '../../ui/Avatar'
import { toast } from '../../ui/Toast'
import { useSession } from '../auth/auth'
import { useAddProgramComment, useProgramComments } from './api'

// Egyeztetés a program körül (hánykor, ki visz kit); a résztvevők értesítést kapnak
export function ProgramComments({ programId, groupId }: { programId: string; groupId: string }) {
  const uid = useSession()?.user.id
  const { data: comments = [] } = useProgramComments(programId)
  const add = useAddProgramComment(programId, groupId)
  const [body, setBody] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await add.mutateAsync(body.trim())
      setBody('')
    } catch {
      toast.error('Nem ment el.')
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="program-chat">
      <h2 id="program-chat" className="text-lg font-bold">Beszélgetés</h2>
      {comments.length === 0 && <p className="text-muted">Hánykor? Ki visz kit? Itt megbeszélhetitek.</p>}
      <ul className="flex flex-col gap-3">
        {comments.map((c) => {
          const mine = c.user_id === uid
          return (
            <li key={c.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              {!mine && c.user && <Avatar name={c.user.display_name} color={c.user.color} src={c.user.avatar_url ?? undefined} size="sm" />}
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${mine ? 'bg-ink text-paper' : 'border border-line bg-surface'}`}>
                {!mine && <p className="text-xs font-semibold text-muted">{c.user?.display_name}</p>}
                <p className="break-words">{c.body}</p>
                <p className={`text-[11px] ${mine ? 'text-paper/70' : 'text-muted'}`}>{timeAgo(c.created_at)}</p>
              </div>
            </li>
          )
        })}
      </ul>
      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          aria-label="Üzenet"
          placeholder="Írj valamit…"
          maxLength={1000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-11 flex-1 rounded-full border border-line bg-surface px-4 text-ink outline-none placeholder:text-muted focus:border-ink"
        />
        <button type="submit" aria-label="Küldés" disabled={!body.trim() || add.isPending} className="flex size-11 items-center justify-center rounded-full bg-accent text-on-accent disabled:opacity-50">
          <SendHorizontal size={20} strokeWidth={1.75} />
        </button>
      </form>
    </section>
  )
}
