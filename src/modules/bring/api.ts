import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Tables } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'

export type Kind = 'consumable' | 'gear'

export function useBringItems(programId: string) {
  const qc = useQueryClient()

  // Realtime csak az épp nyitott programra
  useEffect(() => {
    const refresh = () => qc.invalidateQueries({ queryKey: ['bring', programId] })
    const filter = `program_id=eq.${programId}`
    const channel = supabase
      .channel(`bring:${programId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bring_items', filter }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bring_items', filter }, refresh)
      // DELETE-re nem működik a szűrő
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bring_items' }, refresh)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [programId, qc])

  return useQuery({
    queryKey: ['bring', programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bring_items')
        .select('*, claimer:profiles!bring_items_claimed_by_fkey(display_name, avatar_url, color)')
        .eq('program_id', programId)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

export type BringItem = NonNullable<ReturnType<typeof useBringItems>['data']>[number]

export function useAddItem(programId: string, groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (item: { kind: Kind; name: string; qty: string | null; claimed_by: string | null }) => {
      const { error } = await supabase.from('bring_items').insert({ ...item, program_id: programId, group_id: groupId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bring', programId] }),
  })
}

export function useUpdateItem(programId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<Pick<Tables<'bring_items'>, 'claimed_by' | 'done'>>) => {
      const { error } = await supabase.from('bring_items').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bring', programId] }),
  })
}

export function useDeleteItem(programId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bring_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bring', programId] }),
  })
}
