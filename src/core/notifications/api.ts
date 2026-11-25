import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useSession } from '../auth/auth'

export const NOTIFICATION_TYPES = [
  { type: 'program_created', label: 'Új program' },
  { type: 'member_joined', label: 'Új tag a bandában' },
  { type: 'comment', label: 'Komment a bejegyzésedre' },
] as const

export type NotificationPayload = { title?: string; body?: string; url?: string }

export function useNotifications() {
  const uid = useSession()?.user.id
  return useQuery({
    queryKey: ['notifications', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, payload, read_at, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useNotificationPrefs() {
  return useQuery({
    queryKey: ['notification_prefs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notification_prefs').select('type, enabled')
      if (error) throw error
      return Object.fromEntries(data.map((p) => [p.type, p.enabled]))
    },
  })
}

export function useSetNotificationPref() {
  const qc = useQueryClient()
  const uid = useSession()?.user.id
  return useMutation({
    mutationFn: async ({ type, enabled }: { type: string; enabled: boolean }) => {
      const { error } = await supabase.from('notification_prefs').upsert({ user_id: uid, type, enabled })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification_prefs'] }),
  })
}

// Push ezen az eszközön -------------------------------------------------------

export const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

async function currentSubscription() {
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

export function usePushSubscription() {
  return useQuery({
    queryKey: ['push_subscription'],
    enabled: pushSupported,
    queryFn: async () => (await currentSubscription()) !== null && Notification.permission === 'granted',
  })
}

export function useSetPush() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!enabled) {
        const sub = await currentSubscription()
        if (sub) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          await sub.unsubscribe()
        }
        return
      }
      if ((await Notification.requestPermission()) !== 'granted') throw new Error('permission denied')
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY })
      const json = sub.toJSON()
      const { error } = await supabase.rpc('save_push_subscription', { endpoint: sub.endpoint, p256dh: json.keys!.p256dh, auth: json.keys!.auth })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['push_subscription'] }),
  })
}
