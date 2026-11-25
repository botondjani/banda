import { useState, type FormEvent } from 'react'
import { useGroup } from '../../core/groups/GroupProvider'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { Input } from '../../ui/Input'
import { ListRow } from '../../ui/ListRow'
import { Segmented } from '../../ui/Segmented'
import { Sheet } from '../../ui/Sheet'
import { toast } from '../../ui/Toast'
import { useChallenges, useCreateChallenge } from './api'
import { ChallengeCard } from './components/ChallengeCard'

export function ChallengesPage() {
  const { group } = useGroup()
  const { data: challenges } = useChallenges(group.id)
  const create = useCreateChallenge(group.id)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [days, setDays] = useState('7')

  const now = Date.now()
  const active = challenges?.filter((c) => new Date(c.ends_at).getTime() > now) ?? []
  const past = challenges?.filter((c) => new Date(c.ends_at).getTime() <= now) ?? []

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await create.mutateAsync({ title: title.trim(), description: description.trim() || null, days: Number(days) })
      setTitle('')
      setDescription('')
      setOpen(false)
    } catch {
      toast.error('Nem sikerült.')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Kihívások</h1>
        <p className="mt-1 text-muted">Fotó vagy nem történt meg. A többiek döntik el, hogy ér-e.</p>
      </div>
      {challenges && active.length === 0 && <EmptyState text="Nincs futó kihívás. Unalmas hét lesz." />}
      {active.map((c) => (
        <ChallengeCard key={c.id} c={c} />
      ))}
      <Button variant={active.length ? 'secondary' : 'primary'} onClick={() => setOpen(true)}>Új kihívás</Button>

      {past.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Korábbiak</h2>
          <Card className="py-0">
            {past.map((c) => (
              <ListRow
                key={c.id}
                title={c.title}
                meta={`Teljesítette: ${c.challenge_submissions.filter((s) => s.status === 'valid').map((s) => s.user?.display_name).join(', ') || 'senki'}`}
              />
            ))}
          </Card>
        </section>
      )}

      <Sheet open={open} onOpenChange={setOpen} title="Új kihívás">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input label="Mi a kihívás?" placeholder="Pl. 10 km futás, napfelkelte-fotó" maxLength={80} required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Szabályok" placeholder="Nem kötelező" maxLength={280} value={description} onChange={(e) => setDescription(e.target.value)} />
          <Segmented options={['1', '3', '7'].map((d) => ({ value: d, label: `${d} nap` }))} value={days} onChange={setDays} />
          <Button type="submit" disabled={create.isPending || !title.trim()}>Indítás</Button>
        </form>
      </Sheet>
    </div>
  )
}
