import { Award } from 'lucide-react'
import { useSession } from '../auth/auth'
import { useGroup } from '../groups/GroupProvider'
import { seasonLabel, useBadges, useStandings } from './api'

export function XpSummary() {
  const { group } = useGroup()
  const uid = useSession()!.user.id
  const me = useStandings(group.id).data?.find((s) => s.user_id === uid)
  const { data: badges = [] } = useBadges(group.id, uid)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex gap-8">
        <div>
          <p className="font-display text-4xl font-extrabold tabular-nums">{me?.season_xp ?? 0}</p>
          <p className="text-sm text-muted">XP · {seasonLabel()}</p>
        </div>
        <div>
          <p className="font-display text-4xl font-extrabold text-muted tabular-nums">{me?.total_xp ?? 0}</p>
          <p className="text-sm text-muted">XP összesen</p>
        </div>
      </div>
      {badges.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <li key={b.key} title={b.description} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold">
              <Award size={16} strokeWidth={1.75} /> {b.label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Még nincs jelvényed. Szervezz valamit, az mindig bejön.</p>
      )}
    </section>
  )
}
