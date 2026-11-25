import { useState, type FormEvent } from 'react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { toast } from '../../ui/Toast'
import { useUpdateProfile, type Profile } from './api'

// Hogy a Kassza "Utalás" gombja meg tudja mutatni, hova utaljanak neked
export function PaymentDetails({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const [bank, setBank] = useState(profile.bank_account ?? '')
  const [revolut, setRevolut] = useState(profile.revolut ?? '')
  const dirty = bank !== (profile.bank_account ?? '') || revolut !== (profile.revolut ?? '')

  function save(e: FormEvent) {
    e.preventDefault()
    update.mutate(
      { bank_account: bank.trim() || null, revolut: revolut.trim().replace(/^@/, '') || null },
      { onSuccess: () => toast.success('Mentve.'), onError: () => toast.error('A Revolut-név csak betű, szám, pont, kötőjel lehet.') },
    )
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">Utalási adatok</h2>
      <p className="text-sm text-muted">Csak a bandád látja. Így a Kasszában egy koppintás, hogy kifizessenek.</p>
      <Input label="Bankszámlaszám" inputMode="numeric" autoComplete="off" placeholder="12345678-12345678-12345678" maxLength={40} value={bank} onChange={(e) => setBank(e.target.value)} />
      <Input label="Revolut felhasználónév" autoComplete="off" placeholder="pl. annakiss" maxLength={33} value={revolut} onChange={(e) => setRevolut(e.target.value)} />
      {dirty && <Button type="submit" disabled={update.isPending}>Mentés</Button>}
    </form>
  )
}
