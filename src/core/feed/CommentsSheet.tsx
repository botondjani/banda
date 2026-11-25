import { SendHorizontal } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { timeAgo } from '../../lib/format'
import { Avatar } from '../../ui/Avatar'
import { Sheet } from '../../ui/Sheet'
import { toast } from '../../ui/Toast'
import { useAddComment, useComments } from './api'

type Props = { activityId: string; open: boolean; onOpenChange: (open: boolean) => void }

export function CommentsSheet({ activityId, open, onOpenChange }: Props) {
  const { data: comments = [] } = useComments(activityId, open)
  const add = useAddComment(activityId)
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
    <Sheet open={open} onOpenChange={onOpenChange} title="Kommentek">
      <div className="flex flex-col gap-4">
        {comments.length === 0 && <p className="text-muted">Még senki nem szólt hozzá. Légy az első.</p>}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            {c.user && <Avatar name={c.user.display_name} color={c.user.color} src={c.user.avatar_url ?? undefined} size="sm" />}
            <div className="min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{c.user?.display_name}</span> <span className="text-muted">· {timeAgo(c.created_at)}</span>
              </p>
              <p className="break-words">{c.body}</p>
            </div>
          </div>
        ))}
        <form onSubmit={submit} className="flex items-center gap-2 pt-2">
          <input
            aria-label="Komment"
            placeholder="Írj valamit…"
            maxLength={1000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-11 flex-1 rounded-full border border-line bg-surface px-4 text-ink outline-none placeholder:text-muted focus:border-ink"
          />
          <button
            type="submit"
            aria-label="Küldés"
            disabled={!body.trim() || add.isPending}
            className="flex size-11 items-center justify-center rounded-full bg-accent text-on-accent disabled:opacity-50"
          >
            <SendHorizontal size={20} strokeWidth={1.75} />
          </button>
        </form>
      </div>
    </Sheet>
  )
}
