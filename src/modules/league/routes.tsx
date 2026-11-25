import { useMembers } from '../../core/groups/api'
import { useGroup } from '../../core/groups/GroupProvider'
import { seasonLabel, useStandings } from '../../core/xp/api'
import { Avatar } from '../../ui/Avatar'
import { Card } from '../../ui/Card'
import { ListRow } from '../../ui/ListRow'
import { Tabs } from '../../ui/Tabs'
import { Awards } from './components/Awards'
import { SkeletonList } from '../../ui/Skeleton'

function Standings({ field }: { field: 'season_xp' | 'total_xp' }) {
  const { group } = useGroup()
  const { data: rows } = useStandings(group.id)
  const { data: members = [] } = useMembers(group.id)
  if (!rows) return <SkeletonList rows={3} />
  const sorted = [...rows].sort((a, b) => b[field] - a[field])
  return (
    <Card className="py-0">
      {sorted.map((r, i) => {
        const u = members.find((m) => m.user?.id === r.user_id)?.user
        return u ? (
          <ListRow
            key={r.user_id}
            leading={
              <span className="flex items-center gap-3">
                <span className="w-5 text-right font-display font-bold text-muted tabular-nums">{i + 1}.</span>
                <Avatar name={u.display_name} color={u.color} src={u.avatar_url ?? undefined} />
              </span>
            }
            title={u.display_name}
            value={`${r[field]} XP`}
          />
        ) : null
      })}
    </Card>
  )
}

export function LeaguePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Liga</h1>
        <p className="mt-1 text-muted">Szezon: {seasonLabel()}. Az XP a bandában tett dolgokért jár.</p>
      </div>
      <Tabs
        tabs={[
          { value: 'season', label: 'Szezon', content: <Standings field="season_xp" /> },
          { value: 'total', label: 'Összesített', content: <Standings field="total_xp" /> },
          { value: 'awards', label: 'Díjak', content: <Awards /> },
        ]}
      />
    </div>
  )
}
