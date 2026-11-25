import { useState } from 'react'
import { useSession } from '../../../core/auth/auth'
import { useMembers } from '../../../core/groups/api'
import { useGroup } from '../../../core/groups/GroupProvider'
import { formatFt } from '../../../lib/format'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { ListRow } from '../../../ui/ListRow'
import { Sheet } from '../../../ui/Sheet'
import { useDeleteExpense, type Expense } from '../api'

const MODE_LABELS: Record<string, string> = { equal: 'egyenlően', exact: 'pontos összegekkel', shares: 'arányosan' }

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const { group } = useGroup()
  const uid = useSession()?.user.id
  const { data: members = [] } = useMembers(group.id)
  const remove = useDeleteExpense(group.id)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = expenses.find((e) => e.id === openId)
  const name = (id: string) => members.find((m) => m.user?.id === id)?.user?.display_name ?? '?'

  return (
    <>
      <Card className="py-0">
        {expenses.map((e) => (
          <ListRow
            key={e.id}
            title={e.title}
            meta={`${e.payer?.display_name} fizette · ${new Date(e.created_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}`}
            value={formatFt(e.amount)}
            onClick={() => setOpenId(e.id)}
          />
        ))}
      </Card>
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)} title={open?.title ?? ''}>
        {open && (
          <div className="flex flex-col gap-4">
            <p className="text-muted">
              {open.payer?.display_name} fizette, {MODE_LABELS[open.split_mode]} osztva.
            </p>
            <Card className="py-0">
              {open.expense_splits.map((s) => (
                <ListRow key={s.user_id} title={name(s.user_id)} value={formatFt(s.amount)} />
              ))}
            </Card>
            {open.created_by === uid && (
              <Button variant="secondary" onClick={() => remove.mutate(open.id, { onSuccess: () => setOpenId(null) })}>
                Kiadás törlése
              </Button>
            )}
          </div>
        )}
      </Sheet>
    </>
  )
}
