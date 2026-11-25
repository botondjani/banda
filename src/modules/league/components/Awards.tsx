import { useState, type FormEvent } from 'react'
import { useSession } from '../../../core/auth/auth'
import { useMembers } from '../../../core/groups/api'
import { useGroup } from '../../../core/groups/GroupProvider'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { Chip } from '../../../ui/Chip'
import { Input } from '../../../ui/Input'
import { Sheet } from '../../../ui/Sheet'
import { toast } from '../../../ui/Toast'
import { currentMonth, useAddCategory, useCategories, useMyVotes, useResults, useVoteAward } from '../api'

const monthName = (iso: string) => new Date(`${iso}T12:00`).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })

export function Awards() {
  const { group } = useGroup()
  const uid = useSession()!.user.id
  const { data: members = [] } = useMembers(group.id)
  const { data: categories = [] } = useCategories(group.id)
  const { data: results = [] } = useResults(group.id)
  const { data: myVotes = {} } = useMyVotes(group.id, uid)
  const vote = useVoteAward(group.id, uid)
  const add = useAddCategory(group.id)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')

  const name = (id: string) => members.find((m) => m.user?.id === id)?.user?.display_name ?? '?'
  const month = currentMonth()
  const pastWinners = (cid: string) => {
    const past = results.filter((r) => r.category_id === cid && r.month < month && r.place === 1)
    const last = past.map((r) => r.month).sort().at(-1)
    return last ? { month: last, names: past.filter((r) => r.month === last).map((r) => name(r.nominee_id)) } : null
  }

  // Év végi díjátadó: kategóriánként, aki az idei hónapokban a legtöbbször nyert
  const year = month.slice(0, 4)
  const ceremony = categories.map((c) => {
    const wins = new Map<string, number>()
    for (const r of results) if (r.category_id === c.id && r.place === 1 && r.month.startsWith(year) && r.month < month) wins.set(r.nominee_id, (wins.get(r.nominee_id) ?? 0) + 1)
    const top = Math.max(0, ...wins.values())
    return { c, top, names: [...wins].filter(([, n]) => n === top && top > 0).map(([id]) => name(id)) }
  })

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await add.mutateAsync(title.trim())
      setTitle('')
      setCreating(false)
    } catch {
      toast.error('Nem sikerült.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted">Szavazás: {monthName(month)}. Magadra nem szavazhatsz, akármennyire is megérdemled.</p>
      {categories.length === 0 && <p className="text-muted">Még nincs díj. Találj ki egyet, pl. „A hónap szervezője”.</p>}
      {categories.map((c) => {
        const prev = pastWinners(c.id)
        const now = results.filter((r) => r.category_id === c.id && r.month === month)
        return (
          <Card key={c.id} className="flex flex-col gap-3">
            <div>
              <h3 className="text-lg font-bold">{c.title}</h3>
              {prev && <p className="text-sm text-muted">{monthName(prev.month)}: {prev.names.join(', ')}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {members.flatMap((m) =>
                m.user && m.user.id !== uid ? (
                  <Chip key={m.user.id} selected={myVotes[c.id] === m.user.id} onClick={() => vote.mutate({ categoryId: c.id, nomineeId: m.user!.id })}>
                    {m.user.display_name}
                    {now.find((r) => r.nominee_id === m.user!.id) ? ` · ${now.find((r) => r.nominee_id === m.user!.id)!.votes}` : ''}
                  </Chip>
                ) : [],
              )}
            </div>
          </Card>
        )
      })}
      <Button variant="secondary" onClick={() => setCreating(true)}>Új díj</Button>

      {ceremony.some((x) => x.top > 0) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Díjátadó {year}</h2>
          <Card className="py-0">
            {ceremony.filter((x) => x.top > 0).map((x) => (
              <div key={x.c.id} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{x.c.title}</span>
                  <span className="block truncate text-sm text-muted">{x.names.join(', ')}</span>
                </span>
                <span className="shrink-0 font-display font-semibold tabular-nums">{x.top}×</span>
              </div>
            ))}
          </Card>
        </section>
      )}

      <Sheet open={creating} onOpenChange={setCreating} title="Új díj">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input label="A díj neve" placeholder="Pl. A hónap szervezője, Legnagyobb késő" maxLength={40} required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button type="submit" disabled={add.isPending || !title.trim()}>Létrehozás</Button>
        </form>
      </Sheet>
    </div>
  )
}
