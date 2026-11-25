import { useState, type FormEvent } from 'react'
import { useGroup } from '../../../core/groups/GroupProvider'
import type { SheetProps } from '../../../core/modules'
import { Button } from '../../../ui/Button'
import { Chip } from '../../../ui/Chip'
import { Input } from '../../../ui/Input'
import { Sheet } from '../../../ui/Sheet'
import { toast } from '../../../ui/Toast'
import { useCreateBet } from '../api'

export function NewBetSheet({ open, onOpenChange }: SheetProps) {
  const { group } = useGroup()
  const create = useCreateBet(group.id)
  const [title, setTitle] = useState('')
  const [a, setA] = useState('Igen')
  const [b, setB] = useState('Nem')
  const [stake, setStake] = useState('')
  const [amount, setAmount] = useState('')
  const [toKassza, setToKassza] = useState(false)
  const ft = Number(amount) || null

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await create.mutateAsync({ title: title.trim(), sides: [a.trim(), b.trim()], stake: stake.trim() || null, stakeAmount: ft, toKassza: toKassza && !!ft })
      setTitle('')
      setStake('')
      setAmount('')
      onOpenChange(false)
    } catch {
      toast.error('Nem sikerült.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Fogadjunk, hogy…">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Mire fogadunk?" placeholder="Zoli megint elkésik" maxLength={120} required value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="flex gap-3">
          <Input label="Egyik oldal" maxLength={40} required value={a} onChange={(e) => setA(e.target.value)} />
          <Input label="Másik oldal" maxLength={40} required value={b} onChange={(e) => setB(e.target.value)} />
        </div>
        <Input label="Tét" placeholder="Pl. egy kör" maxLength={60} value={stake} onChange={(e) => setStake(e.target.value)} />
        <Input label="Tét forintban" inputMode="numeric" placeholder="Nem kötelező" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} />
        {ft && (
          <div>
            <Chip selected={toKassza} onClick={() => setToKassza(!toKassza)}>A vesztes tétje a kasszába</Chip>
          </div>
        )}
        <Button type="submit" disabled={create.isPending || !title.trim() || !a.trim() || !b.trim()}>Fogadjunk</Button>
      </form>
    </Sheet>
  )
}
