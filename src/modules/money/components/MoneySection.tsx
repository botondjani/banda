import { useState } from 'react'
import { useGroup } from '../../../core/groups/GroupProvider'
import { formatFt } from '../../../lib/format'
import { Button } from '../../../ui/Button'
import { useExpenses } from '../api'
import { ExpenseList } from './ExpenseList'
import { ExpenseSheet } from './ExpenseSheet'

// Program oldalán: a programhoz kötött kiadások
export function MoneySection({ programId }: { programId: string }) {
  const { group } = useGroup()
  const { data: expenses = [] } = useExpenses(group.id, programId)
  const [adding, setAdding] = useState(false)
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Kassza</h2>
        {total > 0 && <span className="font-display font-semibold text-muted tabular-nums">{formatFt(total)}</span>}
      </div>
      {expenses.length > 0 && <ExpenseList expenses={expenses} />}
      <Button variant="secondary" onClick={() => setAdding(true)}>Kiadás ehhez a programhoz</Button>
      <ExpenseSheet open={adding} onOpenChange={setAdding} programId={programId} />
    </section>
  )
}
