import { Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useGroup } from '../../../core/groups/GroupProvider'
import type { SheetProps } from '../../../core/modules'
import { Button } from '../../../ui/Button'
import { Chip } from '../../../ui/Chip'
import { Input } from '../../../ui/Input'
import { Segmented } from '../../../ui/Segmented'
import { Sheet } from '../../../ui/Sheet'
import { toast } from '../../../ui/Toast'
import { useCreatePoll } from '../api'

type Deadline = 'none' | '1h' | 'tonight' | 'tomorrow'

function closesAt(d: Deadline) {
  const now = new Date()
  if (d === '1h') return new Date(now.getTime() + 3600_000).toISOString()
  if (d === 'tonight') {
    const t = new Date(now)
    t.setHours(22, 0, 0, 0)
    return (t > now ? t : new Date(now.getTime() + 3600_000)).toISOString()
  }
  if (d === 'tomorrow') {
    const t = new Date(now)
    t.setDate(t.getDate() + 1)
    t.setHours(20, 0, 0, 0)
    return t.toISOString()
  }
  return null
}

export function NewPollSheet({ open, onOpenChange }: SheetProps) {
  const { group } = useGroup()
  const create = useCreatePoll(group.id)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [multi, setMulti] = useState(false)
  const [deadline, setDeadline] = useState<Deadline>('none')
  const filled = options.map((o) => o.trim()).filter(Boolean)

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await create.mutateAsync({ question: question.trim(), options: filled, multi, closesAt: closesAt(deadline) })
      setQuestion('')
      setOptions(['', ''])
      onOpenChange(false)
    } catch {
      toast.error('Nem sikerült.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Gyors szavazás">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Kérdés" placeholder="Hova menjünk szombaton?" maxLength={140} required value={question} onChange={(e) => setQuestion(e.target.value)} />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-muted">Lehetőségek</span>
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                aria-label={`${i + 1}. lehetőség`}
                placeholder={`${i + 1}. lehetőség`}
                maxLength={60}
                value={o}
                onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))}
                className="min-h-11 flex-1 rounded-xl border border-line bg-surface px-4 text-ink outline-none placeholder:text-muted focus:border-ink"
              />
              {options.length > 2 && (
                <button type="button" aria-label={`${i + 1}. lehetőség törlése`} onClick={() => setOptions(options.filter((_, j) => j !== i))} className="flex size-11 items-center justify-center text-muted">
                  <X size={20} strokeWidth={1.75} />
                </button>
              )}
            </div>
          ))}
          {options.length < 8 && (
            <button type="button" onClick={() => setOptions([...options, ''])} className="inline-flex min-h-11 items-center gap-1.5 self-start font-semibold">
              <Plus size={18} strokeWidth={1.75} aria-hidden /> Még egy
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-muted">Meddig lehet szavazni?</span>
          <Segmented
            options={[
              { value: 'none', label: 'Nyitva' },
              { value: '1h', label: '1 óra' },
              { value: 'tonight', label: 'Ma este' },
              { value: 'tomorrow', label: 'Holnap' },
            ]}
            value={deadline}
            onChange={setDeadline}
          />
        </div>
        <div>
          <Chip selected={multi} onClick={() => setMulti(!multi)}>Több is választható</Chip>
        </div>
        <Button type="submit" disabled={create.isPending || !question.trim() || filled.length < 2}>Indítás</Button>
      </form>
    </Sheet>
  )
}
