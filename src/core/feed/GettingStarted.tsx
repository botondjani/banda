import { Check, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Card } from '../../ui/Card'
import { useMembers } from '../groups/api'
import { useGroup } from '../groups/GroupProvider'
import { pushSupported, usePushSubscription } from '../notifications/api'
import { useMyProfile } from '../profiles/api'
import { usePrograms } from '../programs/api'

const key = (gid: string) => `banda.onboarding-hidden.${gid}`
const isHidden = (gid: string) => {
  try {
    return localStorage.getItem(key(gid)) === '1'
  } catch {
    return false
  }
}

// Új bandánál az első pár lépés, hogy beinduljon; ha minden kész, eltűnik
export function GettingStarted() {
  const { group } = useGroup()
  const navigate = useNavigate()
  const { data: members } = useMembers(group.id)
  const { data: programs } = usePrograms(group.id)
  const { data: pushOn } = usePushSubscription()
  const { data: profile } = useMyProfile()
  const [hidden, setHidden] = useState(() => isHidden(group.id))
  if (hidden || !members || !programs || !profile) return null

  const steps = [
    { label: 'Hívd meg a többieket', done: members.length > 1, to: '/group' },
    { label: 'Szervezd meg az első programot', done: programs.length > 0, to: '/programs' },
    { label: 'Kapcsold be az értesítéseket', done: !pushSupported || !!pushOn, to: '/profile' },
    { label: 'Tegyél fel profilképet', done: !!profile.avatar_url, to: '/profile' },
  ]
  const done = steps.filter((s) => s.done).length
  if (done === steps.length) return null

  const hide = () => {
    try {
      localStorage.setItem(key(group.id), '1')
    } catch {
      /* nem baj */
    }
    setHidden(true)
  }

  return (
    <Card className="flex flex-col gap-1 pb-1" aria-labelledby="onboarding-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="onboarding-title" className="text-lg font-bold">Első lépések</h2>
          <p className="text-sm text-muted tabular-nums">
            {done}/{steps.length} kész
          </p>
        </div>
        <button aria-label="Első lépések elrejtése" onClick={hide} className="-mt-2 -mr-2 flex size-11 items-center justify-center text-muted">
          <X size={20} strokeWidth={1.75} />
        </button>
      </div>
      <ul>
        {steps.map((s) => (
          <li key={s.label}>
            <button
              onClick={() => navigate(s.to)}
              disabled={s.done}
              className="flex min-h-12 w-full items-center gap-3 border-b border-line text-left last:border-b-0 active:opacity-60 disabled:opacity-100"
            >
              <span
                aria-hidden
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${s.done ? 'border-positive bg-positive text-paper' : 'border-line'}`}
              >
                {s.done && <Check size={14} strokeWidth={3} />}
              </span>
              <span className={`flex-1 ${s.done ? 'text-muted line-through' : 'font-semibold'}`}>
                {s.label}
                <span className="sr-only">{s.done ? ' – kész' : ' – még hátra van'}</span>
              </span>
              {!s.done && <ChevronRight size={20} strokeWidth={1.75} aria-hidden className="text-muted" />}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
