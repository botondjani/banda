import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Json } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'

type Activity = {
  groupId: string
  type: string
  moduleId?: string
  refId?: string
  payload?: Json
}

// Minden modul ezen keresztül jelez a feednek (és később az XP-nek).
export async function emitActivity({ groupId, type, moduleId = 'core', refId, payload = {} }: Activity) {
  const { error } = await supabase.from('activity').insert({ group_id: groupId, type, module_id: moduleId, ref_id: refId, payload })
  if (error) throw error
}

export function useFeed(groupId: string) {
  const qc = useQueryClient()

  useEffect(() => {
    const refresh = () => qc.invalidateQueries({ queryKey: ['feed', groupId] })
    const channel = supabase
      .channel(`feed:${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity', filter: `group_id=eq.${groupId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (p) => {
        refresh()
        const row = (p.new ?? p.old) as { activity_id?: string }
        if (row.activity_id) qc.invalidateQueries({ queryKey: ['comments', row.activity_id] })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, qc])

  return useQuery({
    queryKey: ['feed', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity')
        .select('*, actor:profiles!activity_actor_id_fkey(display_name, avatar_url, color), reactions(emoji, user_id), comments(count)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
  })
}

export type FeedItem = NonNullable<ReturnType<typeof useFeed>['data']>[number]

export function useToggleReaction(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ activityId, emoji, active }: { activityId: string; emoji: string; active: boolean }) => {
      const { error } = active
        ? await supabase.from('reactions').delete().match({ activity_id: activityId, emoji })
        : await supabase.from('reactions').insert({ activity_id: activityId, emoji })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed', groupId] }),
  })
}

export function useComments(activityId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['comments', activityId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('id, body, created_at, user:profiles(display_name, avatar_url, color)')
        .eq('activity_id', activityId)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

export function useAddComment(activityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from('comments').insert({ activity_id: activityId, body })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', activityId] }),
  })
}
