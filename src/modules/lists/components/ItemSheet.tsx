import { ExternalLink } from 'lucide-react'
import { useSession } from '../../../core/auth/auth'
import type { SheetProps } from '../../../core/modules'
import { useMyProfile } from '../../../core/profiles/api'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { ListRow } from '../../../ui/ListRow'
import { Rating } from '../../../ui/Rating'
import { Sheet } from '../../../ui/Sheet'
import { useDeleteListItem, useSetMark, type ListItem } from '../api'
import { presetOf } from '../presets'

export function ItemSheet({ open, onOpenChange, item, presetKey }: SheetProps & { item: ListItem; presetKey: string | null }) {
  const uid = useSession()!.user.id
  const setMark = useSetMark(item, uid, useMyProfile().data?.display_name)
  const remove = useDeleteListItem(item.list_id)
  const preset = presetOf(presetKey)
  const mine = item.list_marks.find((m) => m.user_id === uid)

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={item.title}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm text-muted">{item.adder?.display_name} ajánlja</p>
          {item.note && <p className="mt-1">{item.note}</p>}
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-4">
              Megnyitás <ExternalLink size={16} strokeWidth={1.75} />
            </a>
          )}
        </div>

        {mine ? (
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-muted">A te értékelésed</span>
            <Rating value={mine.rating} onChange={(rating) => setMark.mutate({ done: true, rating })} />
            <Button variant="secondary" onClick={() => setMark.mutate({ done: false })}>Mégsem {preset.done.toLowerCase()}</Button>
          </div>
        ) : (
          <Button onClick={() => setMark.mutate({ done: true })}>{preset.done}</Button>
        )}

        {item.list_marks.length > 0 && (
          <Card className="py-0">
            {item.list_marks.map((m) => (
              <ListRow key={m.user_id} title={m.user?.display_name ?? '?'} value={m.rating ? <Rating value={m.rating} size={16} /> : <span className="text-sm text-muted">nem értékelte</span>} />
            ))}
          </Card>
        )}

        {item.added_by === uid && (
          <Button variant="secondary" onClick={() => remove.mutate(item.id, { onSuccess: () => onOpenChange(false) })}>Törlés</Button>
        )}
      </div>
    </Sheet>
  )
}
