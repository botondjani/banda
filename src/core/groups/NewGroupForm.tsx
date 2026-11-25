import { useState, type FormEvent } from 'react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { toast } from '../../ui/Toast'
import { useCreateGroup } from './api'

export function NewGroupForm({ onDone }: { onDone?: () => void }) {
  const [name, setName] = useState('')
  const create = useCreateGroup()

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await create.mutateAsync(name.trim())
      onDone?.()
    } catch {
      toast.error('Nem sikerült létrehozni.')
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label="A banda neve" placeholder="Pl. Csütörtöki sörözők" maxLength={40} required value={name} onChange={(e) => setName(e.target.value)} />
      <Button type="submit" disabled={create.isPending || !name.trim()}>Banda létrehozása</Button>
    </form>
  )
}
