import { useState, type ReactNode } from 'react'
import { Avatar, USER_COLORS } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Chip } from '../ui/Chip'
import { EmptyState } from '../ui/EmptyState'
import { Input } from '../ui/Input'
import { ListRow } from '../ui/ListRow'
import { Rating } from '../ui/Rating'
import { Sheet } from '../ui/Sheet'
import { Segmented } from '../ui/Segmented'
import { Switch } from '../ui/Switch'
import { Tabs } from '../ui/Tabs'
import { toast } from '../ui/Toast'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{title}</h2>
      {children}
    </section>
  )
}

export function DevUi() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [on, setOn] = useState(true)
  const [rsvpTag, setRsvpTag] = useState('sör')
  const [stars, setStars] = useState<number | null>(4)
  const [rsvp, setRsvp] = useState<'going' | 'maybe' | 'no'>('going')

  return (
    <main className="mx-auto flex max-w-md flex-col gap-10 px-5 py-8">
      <div>
        <h1 className="text-4xl font-extrabold">UI</h1>
        <p className="text-muted">Minden komponens egy helyen.</p>
      </div>

      <Section title="Tipográfia">
        <p className="font-display text-5xl font-bold tabular-nums">−12 400 Ft</p>
        <p>Manrope a UI-szövegre. Senki nem hoz szenet. Megint.</p>
        <p className="flex gap-4 font-semibold">
          <span className="text-positive">+3 500 Ft</span>
          <span className="text-negative">−1 200 Ft</span>
        </p>
      </Section>

      <Section title="Button">
        <Button>Mentés</Button>
        <Button variant="secondary">Mégse</Button>
        <Button disabled>Letiltva</Button>
      </Section>

      <Section title="Input">
        <Input label="Program neve" placeholder="Pl. Balaton, szombat" />
      </Section>

      <Section title="Avatar">
        <div className="flex flex-wrap gap-2">
          {USER_COLORS.map((_, i) => (
            <Avatar key={i} name={['Bence Kiss', 'Anna', 'Zoli Nagy', 'Réka', 'Máté', 'Dóri', 'Peti', 'Lili'][i]} color={i} />
          ))}
        </div>
      </Section>

      <Section title="ListRow">
        <Card className="py-0">
          <ListRow leading={<Avatar name="Bence Kiss" color={0} />} title="Bence" meta="Pizza, 3 db" value="4 800 Ft" />
          <ListRow leading={<Avatar name="Anna" color={1} />} title="Anna" meta="Sátor" value="—" onClick={() => toast('Anna sorára kattintottál')} />
          <ListRow leading={<Avatar name="Zoli Nagy" color={2} />} title="Zoli" meta="Még nem vállalt semmit" />
        </Card>
      </Section>

      <Section title="Card">
        <Card>
          <h3 className="text-lg font-bold">Szombati grill</h3>
          <p className="text-sm text-muted">Nov 29. · Zoliék kertje</p>
        </Card>
      </Section>

      <Section title="Tabs">
        <Tabs
          tabs={[
            { value: 'a', label: 'Fogyóanyag', content: <p className="text-muted">Kaja, pia.</p> },
            { value: 'b', label: 'Felszerelés', content: <p className="text-muted">Sátor, főző.</p> },
          ]}
        />
      </Section>

      <Section title="Chip">
        <div className="flex flex-wrap gap-2">
          {['sör', 'kaja', 'futás'].map((t) => (
            <Chip key={t} selected={t === rsvpTag} onClick={() => setRsvpTag(t)}>{t}</Chip>
          ))}
        </div>
      </Section>

      <Section title="Rating">
        <Rating value={stars} onChange={setStars} />
        <Rating value={3} size={16} />
      </Section>

      <Section title="Segmented">
        <Segmented
          options={[{ value: 'going', label: 'Megyek' }, { value: 'maybe', label: 'Talán' }, { value: 'no', label: 'Nem' }]}
          value={rsvp}
          onChange={setRsvp}
        />
      </Section>

      <Section title="Switch">
        <Card className="py-0">
          <ListRow title="Kassza" meta="Ki tartozik kinek" value={<Switch label="Kassza" checked={on} onChange={setOn} />} />
          <ListRow title="Döntéssegítő" value={<Switch label="Döntéssegítő" checked={!on} onChange={(v) => setOn(!v)} />} />
        </Card>
      </Section>

      <Section title="EmptyState">
        <Card>
          <EmptyState text="Senki nem hoz szenet. Megint." action={<Button>Én hozom</Button>} />
        </Card>
      </Section>

      <Section title="Sheet + Toast">
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>Sheet nyitása</Button>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => toast.success('Mentve.')}>Siker</Button>
          <Button variant="secondary" className="flex-1" onClick={() => toast.error('Ez nem ment át.')}>Hiba</Button>
        </div>
      </Section>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Új program">
        <div className="flex flex-col gap-4">
          <Input label="Cím" placeholder="Mi lesz?" />
          <Button onClick={() => setSheetOpen(false)}>Létrehozás</Button>
        </div>
      </Sheet>
    </main>
  )
}
