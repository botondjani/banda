import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Sheet } from '../../ui/Sheet'
import { toast } from '../../ui/Toast'
import { afterOverlayClose } from '../../ui/useBackClose'
import { useGroup } from '../groups/GroupProvider'
import { Segmented } from '../../ui/Segmented'
import { useCreateProgram, type Recurrence } from './api'

type Props = { open: boolean; onOpenChange: (open: boolean) => void; defaultStartsAt?: string }

export function NewProgramSheet({ open, onOpenChange, defaultStartsAt = '' }: Props) {
  const { group } = useGroup()
  const create = useCreateProgram()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState(defaultStartsAt)
  const [location, setLocation] = useState('')
  const [repeat, setRepeat] = useState<Recurrence | 'once'>('once')

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      const id = await create.mutateAsync({
        groupId: group.id,
        title: title.trim(),
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        location: location.trim() || null,
        recurrence: repeat === 'once' ? null : repeat,
      })
      setTitle('')
      setStartsAt('')
      setLocation('')
      onOpenChange(false)
      afterOverlayClose(() => navigate(`/programs/${id}`))
    } catch {
      toast.error('Nem sikerült menteni.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Új program">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Mi lesz?" placeholder="Pl. Grill Zoliéknál" maxLength={80} required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Mikor?" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        {startsAt && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-muted">Ismétlődik?</span>
            <Segmented
              options={[
                { value: 'once', label: 'Nem' },
                { value: 'weekly', label: 'Hetente' },
                { value: 'biweekly', label: '2 hetente' },
                { value: 'monthly', label: 'Havonta' },
              ]}
              value={repeat}
              onChange={setRepeat}
            />
          </div>
        )}
        <Input label="Hol?" placeholder="Pl. Margitsziget – az időjárás is kiderül" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Button type="submit" disabled={create.isPending || !title.trim()}>Létrehozás</Button>
      </form>
    </Sheet>
  )
}
