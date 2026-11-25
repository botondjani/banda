import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useGoBack } from '../../lib/nav'
import { BackLink } from '../../ui/BackLink'
import { timeAgo } from '../../lib/format'
import { EmptyState } from '../../ui/EmptyState'
import { useMarkAllRead, useNotifications, type NotificationPayload } from './api'
import { SkeletonList } from '../../ui/Skeleton'

export function NotificationsPage() {
  const { data: items } = useNotifications()
  const { mutate: markRead } = useMarkAllRead()
  const navigate = useNavigate()
  const goBack = useGoBack('/')

  // elhagyáskor mind olvasott, hogy itt még látszódjon, mi új
  useEffect(() => () => markRead(), [markRead])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <BackLink label="Vissza" onClick={goBack} />
        <h1 className="mt-2 text-3xl font-bold">Értesítések</h1>
      </div>
      {!items && <SkeletonList rows={4} avatar={false} />}
      {items?.length === 0 && <EmptyState text="Semmi újság. Ami azt illeti, ez is egy újság." />}
      <div>
        {items?.map((n) => {
          const p = n.payload as NotificationPayload
          return (
            <button
              key={n.id}
              onClick={() => navigate(p.url ?? '/')}
              className="flex w-full items-start gap-3 border-b border-line py-3 text-left last:border-b-0"
            >
              <span className={`mt-2 size-2 shrink-0 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-accent-text'}`} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span>{p.body}</span>
                <span className="text-sm text-muted">
                  {p.title} · {timeAgo(n.created_at)}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
