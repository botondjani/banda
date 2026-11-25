import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '../../../core/auth/auth'
import { useGroup } from '../../../core/groups/GroupProvider'
import { useMyProfile } from '../../../core/profiles/api'
import { haptic } from '../../../lib/haptics'
import { Avatar } from '../../../ui/Avatar'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { EmptyState } from '../../../ui/EmptyState'
import { Tabs } from '../../../ui/Tabs'
import { useBringItems, useDeleteItem, useUpdateItem, type BringItem, type Kind } from '../api'
import { AddItemSheet } from './AddItemSheet'
import { KIND_LABELS } from './labels'

function ItemRow({ item, programId }: { item: BringItem; programId: string }) {
  const uid = useSession()?.user.id
  const update = useUpdateItem(programId, useMyProfile().data)
  const remove = useDeleteItem(programId)
  const mine = item.claimed_by === uid
  const small = 'min-h-9 px-4 text-sm'

  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
      <button
        aria-label={item.done ? 'Megvan – visszavonás' : 'Megvan'}
        aria-pressed={item.done}
        disabled={!mine}
        onClick={() => {
          haptic()
          update.mutate({ id: item.id, done: !item.done })
        }}
        className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ${item.done ? 'border-positive bg-positive text-paper' : 'border-line'} disabled:opacity-60`}
      >
        {item.done && <Check size={16} strokeWidth={2.5} />}
      </button>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={`truncate font-semibold ${item.done ? 'text-muted line-through' : ''}`}>{item.name}</span>
        <span className="truncate text-sm text-muted">
          {[item.qty, item.claimer ? item.claimer.display_name : 'Még senki nem hozza'].filter(Boolean).join(' · ')}
        </span>
      </span>
      {!item.claimed_by && (
        <Button variant="secondary" className={small} onClick={() => update.mutate({ id: item.id, claimed_by: uid })}>
          Hozom
        </Button>
      )}
      {mine && !item.done && (
        <Button variant="secondary" className={small} onClick={() => update.mutate({ id: item.id, claimed_by: null })}>
          Mégse
        </Button>
      )}
      {item.claimer && !mine && <Avatar name={item.claimer.display_name} color={item.claimer.color} src={item.claimer.avatar_url ?? undefined} size="sm" />}
      {item.created_by === uid && !item.claimed_by && (
        <button aria-label="Törlés" onClick={() => remove.mutate(item.id)} className="-mr-2 flex size-9 items-center justify-center text-muted">
          <X size={20} strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}

export function BringSection({ programId }: { programId: string }) {
  const { group } = useGroup()
  const { data: items = [] } = useBringItems(programId)
  const [adding, setAdding] = useState<Kind | null>(null)
  const done = items.filter((i) => i.done).length

  const list = (kind: Kind) => {
    const rows = items.filter((i) => i.kind === kind)
    return (
      <div className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <EmptyState
            text={kind === 'consumable' ? 'Senki nem hoz szenet. Megint.' : 'Sátor nélkül is lehet. Elvileg.'}
            action={<Button onClick={() => setAdding(kind)}>Hozzáadás</Button>}
          />
        ) : (
          <>
            <Card className="py-0">
              {rows.map((i) => (
                <ItemRow key={i.id} item={i} programId={programId} />
              ))}
            </Card>
            <Button variant="secondary" onClick={() => setAdding(kind)}>Még valami</Button>
          </>
        )}
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Ki mit hoz</h2>
        {items.length > 0 && (
          <span className="font-display font-semibold text-muted tabular-nums">
            {done}/{items.length} megvan
          </span>
        )}
      </div>
      <Tabs tabs={(['consumable', 'gear'] as const).map((k) => ({ value: k, label: KIND_LABELS[k], content: list(k) }))} />
      <AddItemSheet
        key={adding ?? 'closed'}
        open={adding !== null}
        onOpenChange={(o) => !o && setAdding(null)}
        programId={programId}
        groupId={group.id}
        kind={adding ?? 'consumable'}
      />
    </section>
  )
}
