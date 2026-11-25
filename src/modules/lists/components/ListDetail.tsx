import { Check, Star } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '../../../core/auth/auth'
import { useGroup } from '../../../core/groups/GroupProvider'
import { useMyProfile } from '../../../core/profiles/api'
import { haptic } from '../../../lib/haptics'
import { BackLink } from '../../../ui/BackLink'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { EmptyState } from '../../../ui/EmptyState'
import { useDeleteList, useListItems, useSetMark, type List, type ListItem } from '../api'
import { presetOf } from '../presets'
import { AddListItemSheet } from './AddListItemSheet'
import { ItemSheet } from './ItemSheet'

function DoneButton({ item, label }: { item: ListItem; label: string }) {
  const uid = useSession()!.user.id
  const setMark = useSetMark(item, uid, useMyProfile().data?.display_name)
  const done = item.list_marks.some((m) => m.user_id === uid)
  return (
    <Button
      variant="secondary"
      aria-pressed={done}
      className={`min-h-9 px-4 text-sm ${done ? 'border-ink' : 'text-muted'}`}
      onClick={() => {
        haptic()
        setMark.mutate({ done: !done })
      }}
    >
      {done && <Check size={16} strokeWidth={2.25} />}
      {label}
    </Button>
  )
}

export function ListDetail({ list, onBack }: { list: List; onBack: () => void }) {
  const uid = useSession()!.user.id
  const { group } = useGroup()
  const { data: items } = useListItems(list.id)
  const deleteList = useDeleteList(group.id)
  const preset = presetOf(list.preset_key)
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = items?.find((i) => i.id === openId)

  const meta = (i: ListItem) => {
    const rated = i.list_marks.filter((m) => m.rating)
    const avg = rated.length ? rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length : null
    return (
      <span className="inline-flex items-center gap-1.5">
        {i.adder?.display_name} ajánlja
        {avg !== null && (
          <>
            {' · '}
            <Star size={14} strokeWidth={1.75} className="fill-accent-text text-accent-text" />
            {avg.toLocaleString('hu-HU', { maximumFractionDigits: 1 })}
          </>
        )}
        {i.list_marks.length > 0 && ` · ${i.list_marks.length} ${preset.doneCount}`}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackLink label="Vissza" onClick={onBack} />
        <h1 className="mt-2 text-3xl font-bold">{list.title}</h1>
      </div>
      <Button onClick={() => setAdding(true)}>Ajánlok valamit</Button>
      {items?.length === 0 && <EmptyState text="Üres. Senki nem mer ajánlani? Gyáva banda." />}
      {items && items.length > 0 && (
        <Card className="py-0">
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
              <button onClick={() => setOpenId(i.id)} className="flex min-w-0 flex-1 flex-col text-left">
                <span className="truncate font-semibold">{i.title}</span>
                <span className="truncate text-sm text-muted">{meta(i)}</span>
              </button>
              <DoneButton item={i} label={preset.done} />
            </div>
          ))}
        </Card>
      )}
      {list.kind === 'custom' && list.created_by === uid && (
        <Button variant="secondary" onClick={() => deleteList.mutate(list.id, { onSuccess: onBack })}>Lista törlése</Button>
      )}
      <AddListItemSheet open={adding} onOpenChange={setAdding} list={list} />
      {open && <ItemSheet open onOpenChange={(o) => !o && setOpenId(null)} item={open} presetKey={list.preset_key} />}
    </div>
  )
}
