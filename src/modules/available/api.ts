import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { emitActivity } from '../../core/feed/api'
import { supabase } from '../../lib/supabase'

export const TAGS = ['sör', 'kaja', 'futás', 'mozi', 'játék', 'bármi'] as const

export function useActivePings(groupId: string) {
  return useQuery({
    queryKey: ['pings', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_pings')
        .select('*, user:profiles!availability_pings_user_id_fkey(id, display_name, avatar_url, color), ping_joins(user:profiles(id, display_name, avatar_url, color))')
        .eq('group_id', groupId)
        .gt('until', new Date().toISOString())
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export type Ping = NonNullable<ReturnType<typeof useActivePings>['data']>[number]

function endOfToday() {
  const d = new Date()
  d.setHours(23, 59, 59, 0)
  return d.toISOString()
}

export function useCreatePing(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tag, note }: { tag: string; note: string | null }) => {
      const { data, error } = await supabase
        .from('availability_pings')
        .insert({ group_id: groupId, tag, note, until: endOfToday() })
        .select('id')
        .single()
      if (error) throw error
      await emitActivity({
        groupId,
        moduleId: 'available',
        type: 'ping',
        refId: data.id,
        payload: { tag, note, notify_text: `ráér ma: ${tag}${note ? ` (${note})` : ''}. Benne vagy?`, notify_url: '/m/available' },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pings', groupId] }),
  })
}

export function useJoinPing(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ping: Ping) => {
      const { data: programId, error } = await supabase.rpc('join_ping', { pid: ping.id })
      if (error) throw error
      await emitActivity({
        groupId,
        moduleId: 'available',
        type: 'ping_joined',
        refId: programId,
        payload: { tag: ping.tag, notify_to: ping.user_id, notify_text: `is benne: ${ping.tag}!`, notify_url: `/programs/${programId}` },
      })
      return programId
    },
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useCancelPing(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('availability_pings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pings', groupId] }),
  })
}
