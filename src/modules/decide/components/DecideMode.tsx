import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useMembers } from '../../../core/groups/api'
import { useGroup } from '../../../core/groups/GroupProvider'
import { Button } from '../../../ui/Button'
import { Chip } from '../../../ui/Chip'
import { Input } from '../../../ui/Input'
import { Segmented } from '../../../ui/Segmented'
import { toast } from '../../../ui/Toast'
import { useDraw, type DrawOptions, type DrawResult, type Kind } from '../api'
import { MODES } from '../modes'
import { Reveal } from './Reveal'
import { Wheel } from './Wheel'

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)

export function DecideMode({ kind, onBack }: { kind: Kind; onBack: () => void }) {
  const mode = MODES.find((m) => m.kind === kind)!
  const { group } = useGroup()
  const { data: members = [] } = useMembers(group.id)
  const people = members.flatMap((m) => (m.user ? [m.user] : []))
  const draw = useDraw(group.id)

  const [text, setText] = useState(kind === 'teams' ? people.map((p) => p.display_name).join('\n') : '')
  const [count, setCount] = useState('1')
  const [teams, setTeams] = useState('2')
  const [min, setMin] = useState('1')
  const [max, setMax] = useState('100')
  const [excluded, setExcluded] = useState<string[]>([])
  const [result, setResult] = useState<{ r: DrawResult; o: DrawOptions; key: number } | null>(null)
  const [wheelDone, setWheelDone] = useState(false)

  const items = lines(text)
  const options: DrawOptions =
    kind === 'wheel' || kind === 'shuffle' ? { items }
    : kind === 'teams' ? { items, teams: Number(teams) }
    : kind === 'dice' ? { count: Number(count) }
    : kind === 'number' ? { min: Number(min), max: Number(max) }
    : kind === 'pay' ? { user_ids: people.filter((p) => !excluded.includes(p.id)).map((p) => p.id) }
    : {}
  const valid =
    kind === 'wheel' || kind === 'shuffle' ? items.length >= 2 && items.length <= 30
    : kind === 'teams' ? items.length >= Number(teams)
    : kind === 'number' ? min !== '' && max !== '' && Number(max) >= Number(min)
    : kind === 'pay' ? (options.user_ids ?? []).length > 0
    : true

  function go() {
    setWheelDone(false)
    draw.mutate(
      { kind, options },
      { onSuccess: (r) => setResult({ r, o: options, key: Date.now() }), onError: () => toast.error('Nem sikerült sorsolni.') },
    )
  }

  const textarea = (placeholder: string) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-muted">Soronként egy</span>
      <textarea
        rows={5}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none placeholder:text-muted focus:border-ink"
      />
    </label>
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button onClick={onBack} className="-ml-1 inline-flex items-center gap-1 text-sm font-semibold text-muted">
          <ChevronLeft size={20} strokeWidth={1.75} /> Döntéssegítő
        </button>
        <h1 className="mt-2 text-3xl font-bold">{mode.label}</h1>
      </div>

      {kind === 'wheel' && (
        <>
          <Wheel items={items.length >= 2 ? (result?.o.items ?? items) : ['?', '?']} target={result?.r.index ?? null} onDone={() => setWheelDone(true)} key={result?.key} />
          {result && wheelDone && <p className="text-center font-display text-4xl font-extrabold">{String(result.r.value)}</p>}
          {textarea('pizza\ngyros\nsushi')}
        </>
      )}
      {kind === 'shuffle' && textarea('Anna\nBence\nCili')}
      {kind === 'teams' && (
        <>
          {textarea('Nevek')}
          <Segmented options={['2', '3', '4'].map((v) => ({ value: v, label: `${v} csapat` }))} value={teams} onChange={setTeams} />
        </>
      )}
      {kind === 'dice' && (
        <Segmented options={['1', '2', '3'].map((v) => ({ value: v, label: `${v} kocka` }))} value={count} onChange={setCount} />
      )}
      {kind === 'number' && (
        <div className="flex gap-3">
          <Input label="Minimum" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/[^\d-]/g, ''))} />
          <Input label="Maximum" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d-]/g, ''))} />
        </div>
      )}
      {kind === 'pay' && (
        <div className="flex flex-wrap gap-2">
          {people.map((p) => {
            const on = !excluded.includes(p.id)
            return (
              <Chip key={p.id} selected={on} onClick={() => setExcluded(on ? [...excluded, p.id] : excluded.filter((x) => x !== p.id))}>
                {p.display_name}
              </Chip>
            )
          })}
        </div>
      )}

      {result && kind !== 'wheel' && (
        <div key={result.key} className="flex min-h-40 flex-col items-center justify-center py-4 text-center">
          <Reveal kind={kind} result={result.r} options={result.o} names={people.map((p) => p.display_name)} />
        </div>
      )}

      <Button onClick={go} disabled={!valid || draw.isPending}>
        {result ? 'Még egyszer' : mode.action}
      </Button>
      {result && <p className="text-center text-sm text-muted">Az eredményt a szerver húzta, és bekerült a feedbe.</p>}
    </div>
  )
}
