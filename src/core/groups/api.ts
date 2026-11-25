import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Tables } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { setActiveGroup } from './active'

export type Group = Tables<'groups'>

export function useMyGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('*').order('created_at')
      if (error) throw error
      return data
    },
  })
}

export function useMembers(groupId: string) {
  return useQuery({
    queryKey: ['members', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('role, user:profiles(id, display_name, avatar_url, color)')
        .eq('group_id', groupId)
        .order('joined_at')
      if (error) throw error
      return data
    },
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.rpc('create_group', { group_name: name })
      if (error) throw error
      setActiveGroup(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export async function joinGroup(code: string) {
  const { data, error } = await supabase.rpc('join_group', { code })
  if (error) throw error
  setActiveGroup(data)
}

export function useResetInvite(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('reset_invite_code', { gid: groupId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  })
}

// Nincs sor = bekapcsolva (alapértelmezés)
export function useGroupModules(groupId: string) {
  return useQuery({
    queryKey: ['group_modules', groupId],
    queryFn: async () => {
      const { data, error } = await supabase.from('group_modules').select('module_id, enabled').eq('group_id', groupId)
      if (error) throw error
      return Object.fromEntries(data.map((m) => [m.module_id, m.enabled]))
    },
  })
}

export function useSetModule(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ moduleId, enabled }: { moduleId: string; enabled: boolean }) => {
      const { error } = await supabase.from('group_modules').upsert({ group_id: groupId, module_id: moduleId, enabled })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['group_modules', groupId] }),
  })
}
