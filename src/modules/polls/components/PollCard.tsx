import { Check } from 'lucide-react'
import { useSession } from '../../../core/auth/auth'
import { useGroup } from '../../../core/groups/GroupProvider'
import { formatDateTime } from '../../../lib/format'
import { haptic } from '../../../lib/haptics'
import { toast } from '../../../ui/Toast'
import { isOpen, useVotePoll, type Poll } from '../api'

// Opciók százalékos sávval; nyitott szavazásnál koppintásra szavaz / visszavon
export function PollCard({ poll, showQuestion = true }: { poll: Poll; showQuestion?: boolean }) {
  const { group } = useGroup()
  const uid = useSession()!.user.id
  const vote = useVotePoll(group.id, uid)
  const open = isOpen(poll)
  const mine = poll.poll_votes.filter((v) => v.user_id === uid).map((v) => v.option_id)
  const voters = new Set(poll.poll_votes.map((v) => v.user_id)).size
  const max = Math.max(0, ...poll.poll_options.map((o) => poll.poll_votes.filter((v) => v.option_id === o.id).length))

  function toggle(optionId: string) {
    haptic()
    const next = poll.multi ? (mine.includes(optionId) ? mine.filter((x) => x !== optionId) : [...mine, optionId]) : mine.includes(optionId) ? [] : [optionId]
    vote.mutate({ pollId: poll.id, optionIds: next }, { onError: () => toast.error('Nem ment át, lehet, hogy lezárult.') })
  }

  return (
    <div className="flex flex-col gap-2">
      {showQuestion && <p className="font-display text-lg font-bold">{poll.question}</p>}
      <ul className="flex flex-col gap-2" role="group" aria-label={poll.question}>
        {poll.poll_options.map((o) => {
          const n = poll.poll_votes.filter((v) => v.option_id === o.id).length
          const pct = voters ? Math.round((n / voters) * 100) : 0
          const selected = mine.includes(o.id)
          const leading = !open && n > 0 && n === max
          return (
            <li key={o.id}>
              <button
                aria-pressed={selected}
                disabled={!open}
                onClick={() => toggle(o.id)}
                className={`relative flex min-h-11 w-full items-center gap-2 overflow-hidden rounded-xl border px-3 text-left transition-colors duration-150 active:opacity-70 disabled:active:opacity-100 ${selected ? 'border-ink' : 'border-line'}`}
              >
                <span aria-hidden className="absolute inset-y-0 left-0 bg-[color-mix(in_srgb,var(--accent)_22%,var(--surface))] transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
                <span className="relative flex size-5 shrink-0 items-center justify-center">{selected && <Check size={18} strokeWidth={2.5} aria-hidden />}</span>
                <span className={`relative flex-1 truncate ${leading ? 'font-bold' : 'font-semibold'}`}>{o.label}</span>
                <span className="relative text-sm font-semibold tabular-nums">
                  {pct}%<span className="sr-only">, {n} szavazat</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="text-sm text-muted">
        {voters} szavazó
        {poll.multi && ' · több is választható'}
        {poll.closes_at && (open ? ` · lezárul: ${formatDateTime(poll.closes_at)}` : ' · lezárult')}
      </p>
    </div>
  )
}
