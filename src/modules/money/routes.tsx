import { useState } from 'react'
import { useSession } from '../../core/auth/auth'
import { useMembers } from '../../core/groups/api'
import { useGroup } from '../../core/groups/GroupProvider'
import { formatFt } from '../../lib/format'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { ListRow } from '../../ui/ListRow'
import { toast } from '../../ui/Toast'
import { useBalances, useExpenses, useSettle, useSettlePlan } from './api'
import { ExpenseList } from './components/ExpenseList'
import { ExpenseSheet } from './components/ExpenseSheet'
import { PaymentSheet } from './components/PaymentSheet'
import { SkeletonList } from '../../ui/Skeleton'

export function MoneyPage() {
  const { group } = useGroup()
  const uid = useSession()!.user.id
  const { data: members = [] } = useMembers(group.id)
  const { data: balances = {} } = useBalances(group.id)
  const { data: plan = [] } = useSettlePlan(group.id)
  const { data: expenses } = useExpenses(group.id)
  const settle = useSettle(group.id, uid)
  const [adding, setAdding] = useState(false)
  const [paying, setPaying] = useState<{ from_user: string; to_user: string; amount: number } | null>(null)
  const name = (id: string) => members.find((m) => m.user?.id === id)?.user?.display_name ?? '?'
  const mine = balances[uid] ?? 0

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Kassza</h1>
        <p className={`mt-2 font-display text-4xl font-bold tabular-nums ${mine > 0 ? 'text-positive' : mine < 0 ? 'text-negative' : ''}`}>
          {formatFt(mine, true)}
        </p>
        <p className="text-muted">{mine > 0 ? 'Ennyit kapsz vissza.' : mine < 0 ? 'Ennyivel tartozol.' : 'Tiszta vagy. Gyanúsan tiszta.'}</p>
      </div>

      <Button onClick={() => setAdding(true)}>Új kiadás</Button>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Egyenlegek</h2>
        <Card className="py-0">
          {members.map((m) =>
            m.user ? (
              <ListRow
                key={m.user.id}
                leading={<Avatar name={m.user.display_name} color={m.user.color} src={m.user.avatar_url ?? undefined} />}
                title={m.user.display_name}
                value={
                  <span className={(balances[m.user.id] ?? 0) > 0 ? 'text-positive' : (balances[m.user.id] ?? 0) < 0 ? 'text-negative' : 'text-muted'}>
                    {formatFt(balances[m.user.id] ?? 0, true)}
                  </span>
                }
              />
            ) : null,
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Nullázás</h2>
        {plan.length === 0 ? (
          <p className="text-muted">Senki nem tartozik senkinek. Ritka pillanat.</p>
        ) : (
          <>
            <p className="text-sm text-muted">A lehető legkevesebb utalás, hogy mindenki nullán legyen.</p>
            <Card className="py-0">
              {plan.map((t) => (
                <ListRow
                  key={`${t.from_user}-${t.to_user}`}
                  title={<span className="font-display text-lg tabular-nums">{formatFt(t.amount)}</span>}
                  meta={`${name(t.from_user)} → ${name(t.to_user)}`}
                  value={
                    (uid === t.from_user || uid === t.to_user) && (
                      <Button
                        variant="secondary"
                        className="min-h-9 px-4 text-sm"
                        disabled={settle.isPending}
                        onClick={() =>
                          uid === t.from_user
                            ? setPaying(t)
                            : settle.mutate({ from: t.from_user, to: t.to_user, amount: t.amount }, { onError: () => toast.error('Nem ment.') })
                        }
                      >
                        {uid === t.from_user ? 'Utalás' : 'Megkaptam'}
                      </Button>
                    )
                  }
                />
              ))}
            </Card>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Kiadások</h2>
        {!expenses && <SkeletonList rows={3} avatar={false} />}
        {expenses?.length === 0 && <EmptyState text="Még senki nem fizetett semmit. Vagy csak nem vallotta be." />}
        {expenses && expenses.length > 0 && <ExpenseList expenses={expenses} />}
      </section>

      <ExpenseSheet open={adding} onOpenChange={setAdding} />
      {paying && (
        <PaymentSheet
          open
          onOpenChange={(o) => !o && setPaying(null)}
          to={paying.to_user}
          toName={name(paying.to_user)}
          amount={paying.amount}
          groupName={group.name}
          onPaid={() => settle.mutate({ from: paying.from_user, to: paying.to_user, amount: paying.amount }, { onError: () => toast.error('Nem ment.') })}
        />
      )}
    </div>
  )
}
