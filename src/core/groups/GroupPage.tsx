import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router'
import { modules } from '../../app/modules'
import { useSession } from '../auth/auth'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { ListRow } from '../../ui/ListRow'
import { Switch } from '../../ui/Switch'
import { toast } from '../../ui/Toast'
import { useGroupModules, useMembers, useResetInvite, useSetModule } from './api'
import { useGroup } from './GroupProvider'

export function GroupPage() {
  const { group } = useGroup()
  const uid = useSession()?.user.id
  const { data: members = [] } = useMembers(group.id)
  const { data: moduleState = {} } = useGroupModules(group.id)
  const setModule = useSetModule(group.id)
  const resetInvite = useResetInvite(group.id)
  const isOwner = members.some((m) => m.user?.id === uid && m.role === 'owner')
  const inviteUrl = `${window.location.origin}${import.meta.env.BASE_URL}join/${group.invite_code}`

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: group.name, text: `Gyere a bandába: ${group.name}`, url: inviteUrl }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(inviteUrl)
      toast.success('Link vágólapon.')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link to="/modules" className="-ml-1 inline-flex items-center gap-1 text-sm font-semibold text-muted">
          <ChevronLeft size={20} strokeWidth={1.75} /> Modulok
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{group.name}</h1>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Meghívó</h2>
        <p className="text-sm text-muted">Akinek elküldöd, egy kattintással bent van.</p>
        <Button onClick={share}>Link megosztása</Button>
        {isOwner && (
          <Button variant="secondary" onClick={() => resetInvite.mutate(undefined, { onSuccess: () => toast.success('Új link kész, a régi már nem él.') })}>
            Új link (a régi megszűnik)
          </Button>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Tagok · {members.length}</h2>
        <Card className="py-0">
          {members.map((m) =>
            m.user ? (
              <ListRow
                key={m.user.id}
                leading={<Avatar name={m.user.display_name} color={m.user.color} src={m.user.avatar_url ?? undefined} />}
                title={m.user.display_name}
                meta={m.role === 'owner' ? 'Alapító' : undefined}
              />
            ) : null,
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Modulok</h2>
        {modules.length === 0 ? (
          <p className="text-sm text-muted">Még nincs bekapcsolható modul. Jönnek.</p>
        ) : (
          <Card className="py-0">
            {modules.map((m) => (
              <ListRow
                key={m.id}
                leading={<m.icon size={20} strokeWidth={1.75} />}
                title={m.name}
                value={
                  <Switch
                    label={m.name}
                    checked={moduleState[m.id] ?? true}
                    onChange={(enabled) => setModule.mutate({ moduleId: m.id, enabled })}
                  />
                }
              />
            ))}
          </Card>
        )}
      </section>
    </div>
  )
}
