import { useNavigate } from 'react-router'
import { useSession } from '../../../core/auth/auth'
import { useGroup } from '../../../core/groups/GroupProvider'
import { Button } from '../../../ui/Button'
import { toast } from '../../../ui/Toast'
import { useCancelPing, useJoinPing, type Ping } from '../api'

// "Én is" / "Benne vagy" / saját: visszavonás
export function PingAction({ ping }: { ping: Ping }) {
  const uid = useSession()?.user.id
  const { group } = useGroup()
  const join = useJoinPing(group.id)
  const cancel = useCancelPing(group.id)
  const navigate = useNavigate()

  if (ping.user_id === uid) {
    return (
      <Button variant="secondary" className="min-h-9 px-4 text-sm" disabled={cancel.isPending} onClick={() => cancel.mutate(ping.id)}>
        Mégse
      </Button>
    )
  }
  if (ping.ping_joins.some((j) => j.user?.id === uid)) {
    return (
      <Button variant="secondary" className="min-h-9 px-4 text-sm" onClick={() => ping.program_id && navigate(`/programs/${ping.program_id}`)}>
        Benne vagy
      </Button>
    )
  }
  return (
    <Button
      className="min-h-9 px-4 text-sm"
      disabled={join.isPending}
      onClick={() =>
        join.mutate(ping, {
          onSuccess: (programId) => navigate(`/programs/${programId}`),
          onError: () => toast.error('Ez már lejárt.'),
        })
      }
    >
      Én is
    </Button>
  )
}
