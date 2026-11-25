import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { useGroup } from '../../core/groups/GroupProvider'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Input } from '../../ui/Input'
import { ListRow } from '../../ui/ListRow'
import { Sheet } from '../../ui/Sheet'
import { toast } from '../../ui/Toast'
import { useCreateList, useLists } from './api'
import { ListDetail } from './components/ListDetail'
import { presetOf } from './presets'

export function ListsPage() {
  const { group } = useGroup()
  const { data: lists = [] } = useLists(group.id)
  const create = useCreateList(group.id)
  const [params, setParams] = useSearchParams()
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const current = lists.find((l) => l.id === params.get('list'))

  if (current) return <ListDetail key={current.id} list={current} onBack={() => setParams({})} />

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      const id = await create.mutateAsync(title.trim())
      setTitle('')
      setCreating(false)
      setParams({ list: id })
    } catch {
      toast.error('Nem sikerült létrehozni.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Listák</h1>
        <p className="mt-1 text-muted">Mit nézzünk, hova menjünk, mit olvass végre.</p>
      </div>
      <Card className="py-0">
        {lists.map((l) => {
          const Icon = presetOf(l.preset_key).icon
          return (
            <ListRow
              key={l.id}
              leading={<Icon size={20} strokeWidth={1.75} />}
              title={l.title}
              value={<span className="text-sm text-muted tabular-nums">{l.list_items[0]?.count ?? 0}</span>}
              onClick={() => setParams({ list: l.id })}
            />
          )
        })}
      </Card>
      <Button variant="secondary" onClick={() => setCreating(true)}>Saját lista</Button>
      <Sheet open={creating} onOpenChange={setCreating} title="Új lista">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input label="Mi legyen a neve?" placeholder="Pl. Társasjátékok, Túrák, Borok" maxLength={40} required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button type="submit" disabled={create.isPending || !title.trim()}>Létrehozás</Button>
        </form>
      </Sheet>
    </div>
  )
}
