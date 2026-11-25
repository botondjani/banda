import { Bell, MessageCircle, SmilePlus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { formatDateTime, timeAgo } from '../../lib/format'
import { haptic } from '../../lib/haptics'
import { Avatar } from '../../ui/Avatar'
import { EmptyState } from '../../ui/EmptyState'
import { Button } from '../../ui/Button'
import { useSession } from '../auth/auth'
import { useGroup } from '../groups/GroupProvider'
import { useFeed, useToggleReaction, type FeedItem } from './api'
import { useEnabledModules } from '../modules'
import { useNotifications } from '../notifications/api'
import { NewProgramSheet } from '../programs/NewProgramSheet'
import { CommentsSheet } from './CommentsSheet'
import { SkeletonList } from '../../ui/Skeleton'
import { InstallBanner } from '../pwa/InstallBanner'

const EMOJIS = ['👍', '❤️', '😂', '🔥', '🍻']

function describe(item: FeedItem): { text: string; extra?: ReactNode } {
  const p = (item.payload ?? {}) as { title?: string; starts_at?: string | null }
  switch (item.type) {
    case 'program_created':
      return {
        text: 'programot szervez',
        extra: (
          <Link to={`/programs/${item.ref_id}`} className="mt-2 block rounded-card border border-line bg-surface px-4 py-3">
            <span className="block font-semibold">{p.title}</span>
            <span className="text-sm text-muted">{p.starts_at ? formatDateTime(p.starts_at) : 'Időpont még nincs'}</span>
          </Link>
        ),
      }
    case 'member_joined':
      return { text: 'csatlakozott a bandához. Hali!' }
    default:
      return { text: 'csinált valamit' }
  }
}

function ActivityRow({ item }: { item: FeedItem }) {
  const { group } = useGroup()
  const Body = useEnabledModules().find((m) => m.id === item.module_id)?.feed?.[item.type]
  const uid = useSession()?.user.id
  const toggle = useToggleReaction(group.id)
  const [picker, setPicker] = useState(false)
  const [comments, setComments] = useState(false)
  const { text, extra } = describe(item)
  const commentCount = item.comments[0]?.count ?? 0

  const counts = EMOJIS.map((emoji) => {
    const rs = item.reactions.filter((r) => r.emoji === emoji)
    return { emoji, count: rs.length, mine: rs.some((r) => r.user_id === uid) }
  })
  const react = (emoji: string, mine: boolean) => {
    haptic()
    toggle.mutate({ activityId: item.id, emoji, active: mine })
    setPicker(false)
  }

  const pill = 'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold tabular-nums'

  return (
    <article className="flex gap-3 border-b border-line py-4 last:border-b-0">
      {item.actor && <Avatar name={item.actor.display_name} color={item.actor.color} src={item.actor.avatar_url ?? undefined} />}
      <div className="min-w-0 flex-1">
        {Body ? (
          <Body item={item} />
        ) : (
          <p>
            <span className="font-semibold">{item.actor?.display_name}</span> {text}
          </p>
        )}
        <p className="text-sm text-muted">{timeAgo(item.created_at)}</p>
        {!Body && extra}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {counts
            .filter((c) => c.count > 0)
            .map((c) => (
              <button key={c.emoji} onClick={() => react(c.emoji, c.mine)} className={`${pill} ${c.mine ? 'border-accent-text text-accent-text' : 'border-line text-muted'}`}>
                <span>{c.emoji}</span>
                {c.count}
              </button>
            ))}
          <button aria-label="Reakció" onClick={() => setPicker(!picker)} className={`${pill} border-line text-muted`}>
            <SmilePlus size={18} strokeWidth={1.75} />
          </button>
          <button aria-label="Kommentek" onClick={() => setComments(true)} className={`${pill} border-line text-muted`}>
            <MessageCircle size={18} strokeWidth={1.75} />
            {commentCount > 0 && commentCount}
          </button>
        </div>
        {picker && (
          <div className="mt-2 flex gap-1">
            {counts.map((c) => (
              <button key={c.emoji} onClick={() => react(c.emoji, c.mine)} className="flex size-11 items-center justify-center rounded-full text-xl active:bg-line">
                {c.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      <CommentsSheet activityId={item.id} open={comments} onOpenChange={setComments} />
    </article>
  )
}

export function FeedPage() {
  const { group } = useGroup()
  const { data } = useFeed(group.id)
  const modules = useEnabledModules()
  const feed = data?.filter((i) => i.module_id === 'core' || modules.some((m) => m.id === i.module_id))
  const [newProgram, setNewProgram] = useState(false)
  const unread = useNotifications().data?.filter((n) => !n.read_at).length ?? 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold">{group.name}</h1>
        <Link to="/notifications" aria-label="Értesítések" className="relative -mr-2 flex size-11 shrink-0 items-center justify-center">
          <Bell size={20} strokeWidth={1.75} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-on-accent tabular-nums">
              {unread}
            </span>
          )}
        </Link>
      </div>
      <InstallBanner />
      {modules.map((m) => m.FeedTop && <m.FeedTop key={m.id} />)}
      {!feed && <SkeletonList rows={4} />}
      {feed?.length === 0 && <EmptyState text="Csend van. Gyanúsan nagy csend." action={<Button onClick={() => setNewProgram(true)}>Szervezek valamit</Button>} />}
      {feed?.map((item) => <ActivityRow key={item.id} item={item} />)}
      <NewProgramSheet open={newProgram} onOpenChange={setNewProgram} />
    </div>
  )
}
