import { useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { Avatar, USER_COLORS } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Input } from '../../ui/Input'
import { ListRow } from '../../ui/ListRow'
import { Sheet } from '../../ui/Sheet'
import { toast } from '../../ui/Toast'
import { useSession } from '../auth/auth'
import { useGroup } from '../groups/GroupProvider'
import { NewGroupForm } from '../groups/NewGroupForm'
import { NotificationSettings } from '../notifications/NotificationSettings'
import { uploadAvatar, useMyProfile, useUpdateProfile } from './api'

export function ProfilePage() {
  const session = useSession()
  const qc = useQueryClient()
  const { data: profile } = useMyProfile()
  const update = useUpdateProfile()
  const { group, groups, setGroupId } = useGroup()
  const [name, setName] = useState<string>()
  const [newGroup, setNewGroup] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  if (!profile || !session) return null
  const displayName = name ?? profile.display_name

  function saveName(e: FormEvent) {
    e.preventDefault()
    update.mutate({ display_name: displayName.trim() }, { onSuccess: () => toast.success('Mentve.') })
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      update.mutate({ avatar_url: await uploadAvatar(session!.user.id, file) })
    } catch {
      toast.error('Nem sikerült feltölteni.')
    }
    setUploading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    qc.clear()
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Profil</h1>

      <div className="flex items-center gap-4">
        <Avatar name={displayName || '?'} color={profile.color} src={profile.avatar_url ?? undefined} size="lg" />
        <div className="flex flex-col items-start gap-1">
          <button className="font-semibold text-ink underline underline-offset-4" disabled={uploading} onClick={() => fileInput.current?.click()}>
            {uploading ? 'Feltöltés…' : 'Fotó cseréje'}
          </button>
          {profile.avatar_url && (
            <button className="text-sm text-muted" onClick={() => update.mutate({ avatar_url: null })}>
              Fotó törlése
            </button>
          )}
        </div>
        <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>

      <form onSubmit={saveName} className="flex flex-col gap-3">
        <Input label="Név" maxLength={40} required value={displayName} onChange={(e) => setName(e.target.value)} />
        {name !== undefined && name.trim() !== profile.display_name && (
          <Button type="submit" disabled={!name.trim()}>Mentés</Button>
        )}
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">Színed</h2>
        <div className="flex flex-wrap gap-2">
          {USER_COLORS.map((c, i) => (
            <button
              key={c}
              aria-label={`${i + 1}. szín`}
              aria-pressed={profile.color === i}
              onClick={() => update.mutate({ color: i })}
              className="flex size-11 items-center justify-center rounded-full text-[#191714]"
              style={{ background: c }}
            >
              {profile.color === i && <Check size={20} strokeWidth={2.25} />}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Bandáid</h2>
        <Card className="py-0">
          {groups.map((g) => (
            <ListRow
              key={g.id}
              title={g.name}
              value={g.id === group.id ? <Check size={20} strokeWidth={1.75} className="text-accent" /> : undefined}
              onClick={() => setGroupId(g.id)}
            />
          ))}
        </Card>
        <Button variant="secondary" onClick={() => setNewGroup(true)}>Új banda</Button>
      </section>

      <NotificationSettings />

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">{session.user.email}</p>
        <Button variant="secondary" onClick={signOut}>Kijelentkezés</Button>
      </div>

      <Sheet open={newGroup} onOpenChange={setNewGroup} title="Új banda">
        <NewGroupForm onDone={() => setNewGroup(false)} />
      </Sheet>
    </div>
  )
}
