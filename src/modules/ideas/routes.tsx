import { AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { useSession } from '../../core/auth/auth'
import { useGroup } from '../../core/groups/GroupProvider'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { ListRow } from '../../ui/ListRow'
import { Segmented } from '../../ui/Segmented'
import { haptic } from '../../lib/haptics'
import { toast } from '../../ui/Toast'
import { useIdeas, useSetThreshold, useThreshold, useVote, type Idea, type Vote } from './api'
import { NewIdeaSheet } from './components/NewIdeaSheet'
import { SwipeCard } from './components/SwipeCard'
import { SkeletonList } from '../../ui/Skeleton'

export function IdeasPage() {
  const { group } = useGroup()
  const uid = useSession()!.user.id
  const { data: ideas } = useIdeas(group.id)
  const { data: threshold = 3 } = useThreshold(group.id)
  const setThreshold = useSetThreshold(group.id)
  const vote = useVote(group.id, uid)
  const [adding, setAdding] = useState(false)

  const inCount = (i: Idea) => i.idea_votes.filter((v) => v.vote === 'in').length
  const myVote = (i: Idea) => i.idea_votes.find((v) => v.user_id === uid)?.vote as Vote | undefined
  const queue = ideas?.filter((i) => !myVote(i)) ?? []
  const top = queue[0]
  const cast = (ideaId: string, v: Vote) => {
    haptic(v === 'in' ? 14 : 8)
    vote.mutate({ ideaId, vote: v }, { onError: () => toast.error('Nem ment át a szavazat.') })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Ötletbank</h1>
        <p className="mt-1 text-muted">{threshold} „benne” kell, és lesz belőle program.</p>
      </div>

      {!ideas && <SkeletonList rows={1} avatar={false} />}
      {top ? (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <AnimatePresence mode="popLayout">
              <SwipeCard key={top.id} idea={top} inCount={inCount(top)} threshold={threshold} onVote={(v) => cast(top.id, v)} />
            </AnimatePresence>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => cast(top.id, 'pass')}>Passz</Button>
            <Button className="flex-1" onClick={() => cast(top.id, 'in')}>Benne vagyok</Button>
          </div>
          {queue.length > 1 && <p className="text-center text-sm text-muted">Még {queue.length - 1} ötlet vár rád.</p>}
        </div>
      ) : (
        ideas && <EmptyState text={ideas.length ? 'Mindenre szavaztál. Dobj be te is valamit.' : 'Üres az ötletbank. Valakinek muszáj kitalálni valamit.'} />
      )}

      <Button variant="secondary" onClick={() => setAdding(true)}>Új ötlet</Button>

      {ideas && ideas.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Ötletek</h2>
          <Card className="py-0">
            {ideas.map((i) => {
              const mine = myVote(i)
              return (
                <ListRow
                  key={i.id}
                  title={i.title}
                  meta={`${inCount(i)}/${threshold} benne · ${i.creator?.display_name} ötlete`}
                  value={
                    mine && (
                      <Button variant="secondary" className="min-h-9 px-4 text-sm" onClick={() => cast(i.id, mine === 'in' ? 'pass' : 'in')}>
                        {mine === 'in' ? 'Benne' : 'Passz'}
                      </Button>
                    )
                  }
                />
              )
            })}
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Küszöb</h2>
        <Segmented
          options={['2', '3', '4', '5'].map((v) => ({ value: v, label: v }))}
          value={String(threshold)}
          onChange={(v) => setThreshold.mutate(Number(v))}
        />
      </section>

      <NewIdeaSheet open={adding} onOpenChange={setAdding} />
    </div>
  )
}
