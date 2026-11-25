import { useQuery } from '@tanstack/react-query'
import { Copy, ExternalLink } from 'lucide-react'
import type { SheetProps } from '../../../core/modules'
import { formatFt } from '../../../lib/format'
import { haptic } from '../../../lib/haptics'
import { supabase } from '../../../lib/supabase'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { Sheet } from '../../../ui/Sheet'
import { toast } from '../../../ui/Toast'

type Props = SheetProps & { to: string; toName: string; amount: number; groupName: string; onPaid: () => void }

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <button
      className="flex w-full items-center justify-between gap-3 border-b border-line py-3 text-left last:border-b-0 active:opacity-60"
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        haptic()
        toast.success(`${label} kimásolva.`)
      }}
    >
      <span className="min-w-0">
        <span className="block text-sm text-muted">{label}</span>
        <span className="block truncate font-semibold tabular-nums">{value}</span>
      </span>
      <Copy size={20} strokeWidth={1.75} aria-hidden className="shrink-0 text-muted" />
      <span className="sr-only">Másolás</span>
    </button>
  )
}

export function PaymentSheet({ open, onOpenChange, to, toName, amount, groupName, onPaid }: Props) {
  const { data: payee } = useQuery({
    queryKey: ['payee', to],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('bank_account, revolut').eq('id', to).single()
      if (error) throw error
      return data
    },
  })
  const note = `Banda – ${groupName}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`Utalás neki: ${toName}`}>
      <div className="flex flex-col gap-4">
        <p className="font-display text-4xl font-extrabold tabular-nums">{formatFt(amount)}</p>
        <Card className="py-0">
          <CopyRow label="Összeg" value={String(amount)} />
          {payee?.bank_account && <CopyRow label="Számlaszám" value={payee.bank_account} />}
          <CopyRow label="Közlemény" value={note} />
        </Card>
        {payee?.revolut && (
          <a
            href={`https://revolut.me/${encodeURIComponent(payee.revolut)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 font-semibold"
          >
            Revolut: @{payee.revolut} <ExternalLink size={16} strokeWidth={1.75} aria-hidden />
          </a>
        )}
        {payee && !payee.bank_account && !payee.revolut && (
          <p className="text-sm text-muted">{toName} még nem adta meg az utalási adatait. Szólj neki, hogy a Profilban pótolja.</p>
        )}
        <Button
          onClick={() => {
            onPaid()
            onOpenChange(false)
          }}
        >
          Kifizettem
        </Button>
      </div>
    </Sheet>
  )
}
