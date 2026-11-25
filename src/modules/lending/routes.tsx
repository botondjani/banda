import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useSession } from '../../core/auth/auth'
import { useGroup } from '../../core/groups/GroupProvider'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { Input } from '../../ui/Input'
import { ListRow } from '../../ui/ListRow'
import { Sheet } from '../../ui/Sheet'
import { toast } from '../../ui/Toast'
import { dueLabel, useAddLendItem, useDeleteLendItem, useLendItems, useRespondLoan, useReturnLoan, type LendItem } from './api'
import { RequestSheet } from './components/RequestSheet'
import { SkeletonList } from '../../ui/Skeleton'

const today = () => new Date().toISOString().slice(0, 10)
const small = 'min-h-9 px-4 text-sm'

export function LendingPage() {
  const { group } = useGroup()
  const uid = useSession()!.user.id
  const { data: items } = useLendItems(group.id)
  const add = useAddLendItem(group.id)
  const remove = useDeleteLendItem(group.id)
  const respond = useRespondLoan(group.id)
  const giveBack = useReturnLoan(group.id)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [asking, setAsking] = useState<LendItem | null>(null)
  const err = () => toast.error('Nem ment át.')

  const withMe = items?.filter((i) => i.open?.status === 'active' && i.open.borrower_id === uid) ?? []
  const requests = items?.filter((i) => i.owner_id === uid && i.open?.status === 'requested') ?? []
  const overdue = (due: string) => due < today()

  // Nevekhez nem fűzünk ragot (Bence -> Bencénél), ezért "név · dátum" forma
  const status = (i: LendItem) => {
    if (!i.open) return 'Szabad'
    const me = i.open.borrower_id === uid
    if (i.open.status === 'requested') return me ? 'Elkérted' : `Elkérte: ${i.open.borrower?.display_name}`
    const late = overdue(i.open.due_date) ? ' – lejárt!' : ''
    return `${me ? 'Nálad' : `Kölcsönben: ${i.open.borrower?.display_name}`}, ${dueLabel(i.open.due_date)}-ig${late}`
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await add.mutateAsync({ name: name.trim(), note: note.trim() || null })
      setName('')
      setNote('')
      setAdding(false)
    } catch {
      toast.error('Nem sikerült.')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Kölcsönző</h1>
        <p className="mt-1 text-muted">Ki mit tud odaadni, és kinél van éppen.</p>
      </div>

      {requests.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Elkérnék tőled</h2>
          <Card className="py-0">
            {requests.map((i) => (
              <ListRow
                key={i.id}
                title={i.name}
                meta={`${i.open!.borrower?.display_name}, ${dueLabel(i.open!.due_date)}-ig`}
                value={
                  <span className="flex gap-2">
                    <Button variant="secondary" className={small} onClick={() => respond.mutate({ item: i, loan: i.open!, approve: false }, { onError: err })}>Nem</Button>
                    <Button className={small} onClick={() => respond.mutate({ item: i, loan: i.open!, approve: true }, { onError: err })}>Odaadom</Button>
                  </span>
                }
              />
            ))}
          </Card>
        </section>
      )}

      {withMe.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Nálad van</h2>
          <Card className="py-0">
            {withMe.map((i) => (
              <ListRow
                key={i.id}
                title={i.name}
                meta={`${i.owner?.display_name} cucca`}
                value={
                  <span className={`text-sm font-semibold ${overdue(i.open!.due_date) ? 'text-negative' : 'text-muted'}`}>
                    {overdue(i.open!.due_date) ? 'Lejárt!' : `${dueLabel(i.open!.due_date)}-ig`}
                  </span>
                }
              />
            ))}
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Cuccok</h2>
        {!items && <SkeletonList rows={3} avatar={false} />}
        {items?.length === 0 && <EmptyState text="Senki nem ad kölcsön semmit. Pedig valakinek biztos van sátra." />}
        {items && items.length > 0 && (
          <Card className="py-0">
            {items.map((i) => {
              const mine = i.owner_id === uid
              let action = null
              if (!i.open && !mine) action = <Button variant="secondary" className={small} onClick={() => setAsking(i)}>Elkérem</Button>
              else if (mine && i.open?.status === 'active')
                action = <Button variant="secondary" className={small} onClick={() => giveBack.mutate({ item: i, loan: i.open! }, { onError: err })}>Visszakaptam</Button>
              else if (mine && !i.open)
                action = (
                  <button aria-label="Törlés" className="-mr-2 flex size-9 items-center justify-center text-muted" onClick={() => remove.mutate(i.id, { onError: err })}>
                    <X size={20} strokeWidth={1.75} />
                  </button>
                )
              return (
                <ListRow
                  key={i.id}
                  title={i.name}
                  meta={
                    <span className={i.open?.status === 'active' && overdue(i.open.due_date) ? 'text-negative' : ''}>
                      {mine ? 'Tiéd' : i.owner?.display_name} · {status(i)}
                    </span>
                  }
                  value={action}
                />
              )
            })}
          </Card>
        )}
        <Button variant="secondary" onClick={() => setAdding(true)}>Kölcsönadnám</Button>
      </section>

      <Sheet open={adding} onOpenChange={setAdding} title="Mit tudsz kölcsönadni?">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input label="Mi az?" placeholder="Pl. sátor, fúrógép, Catan" maxLength={60} required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Megjegyzés" placeholder="Pl. 4 személyes, a cövek hiányzik" maxLength={140} value={note} onChange={(e) => setNote(e.target.value)} />
          <Button type="submit" disabled={add.isPending || !name.trim()}>Felveszem</Button>
        </form>
      </Sheet>
      {asking && <RequestSheet open onOpenChange={(o) => !o && setAsking(null)} item={asking} />}
    </div>
  )
}
