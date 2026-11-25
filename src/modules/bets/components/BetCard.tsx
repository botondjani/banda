import { useSession } from '../../../core/auth/auth'
import { useGroup } from '../../../core/groups/GroupProvider'
import { formatFt } from '../../../lib/format'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { toast } from '../../../ui/Toast'
import { useCloseBet, usePick, useVoteBet, type Bet } from '../api'

const STATUS: Record<string, string> = { open: 'Lehet tippelni', closed: 'Szavazás: ki nyert?', resolved: 'Eldőlt' }

export function BetCard({ bet }: { bet: Bet }) {
  const { group } = useGroup()
  const uid = useSession()!.user.id
  const pick = usePick(group.id, uid)
  const close = useCloseBet(group.id)
  const vote = useVoteBet(group.id, uid)
  const myPick = bet.bet_picks.find((p) => p.user_id === uid)?.side_id
  const myVote = bet.bet_votes.find((v) => v.user_id === uid)?.side_id
  const stake = [bet.stake, bet.stake_amount && formatFt(bet.stake_amount)].filter(Boolean).join(', ')
  const err = () => toast.error('Nem ment át.')
  const small = 'min-h-9 px-4 text-sm'

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-muted">
          {bet.creator?.display_name} · {STATUS[bet.status]}
        </p>
        <h3 className="mt-1 text-xl font-bold">Fogadjunk, hogy {bet.title}</h3>
        {stake && (
          <p className="mt-1 text-sm text-muted">
            Tét: {stake}
            {bet.to_kassza && ' · a vesztes tétje a kasszába megy'}
          </p>
        )}
      </div>

      <div className="flex flex-col">
        {bet.bet_sides.map((s) => {
          const pickers = bet.bet_picks.filter((p) => p.side_id === s.id)
          const votes = bet.bet_votes.filter((v) => v.side_id === s.id).length
          const won = bet.status === 'resolved' && bet.winning_side === s.id
          return (
            <div key={s.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={`truncate font-semibold ${won ? 'text-positive' : ''}`}>
                  {s.label}
                  {won && ' – nyert'}
                </span>
                <span className="truncate text-sm text-muted">{pickers.map((p) => p.user?.display_name).join(', ') || 'Senki nem tett rá'}</span>
              </span>
              {bet.status === 'open' && (
                <Button variant="secondary" className={`${small} ${myPick === s.id ? 'border-ink' : 'text-muted'}`} onClick={() => pick.mutate({ betId: bet.id, sideId: s.id }, { onError: err })}>
                  {myPick === s.id ? 'Erre tettél' : 'Erre teszek'}
                </Button>
              )}
              {bet.status === 'closed' && (
                <Button variant="secondary" className={`${small} ${myVote === s.id ? 'border-ink' : 'text-muted'}`} onClick={() => vote.mutate({ betId: bet.id, sideId: s.id }, { onError: err })}>
                  Ez nyert{votes ? ` · ${votes}` : ''}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {bet.status === 'open' && bet.created_by === uid && (
        <Button variant="secondary" onClick={() => close.mutate(bet.id, { onError: err })}>Lezárom a tippelést</Button>
      )}
    </Card>
  )
}
