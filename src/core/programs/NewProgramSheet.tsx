import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Sheet } from '../../ui/Sheet'
import { toast } from '../../ui/Toast'
import { useGroup } from '../groups/GroupProvider'
import { useCreateProgram } from './api'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

export function NewProgramSheet({ open, onOpenChange }: Props) {
  const { group } = useGroup()
  const create = useCreateProgram()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [location, setLocation] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      const id = await create.mutateAsync({
        groupId: group.id,
        title: title.trim(),
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        location: location.trim() || null,
      })
      setTitle('')
      setStartsAt('')
      setLocation('')
      onOpenChange(false)
      navigate(`/programs/${id}`)
    } catch {
      toast.error('Nem sikerült menteni.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Új program">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Mi lesz?" placeholder="Pl. Grill Zoliéknál" maxLength={80} required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Mikor?" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        <Input label="Hol?" placeholder="Nem kötelező" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Button type="submit" disabled={create.isPending || !title.trim()}>Létrehozás</Button>
      </form>
    </Sheet>
  )
}
