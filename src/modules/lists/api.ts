import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { emitActivity } from '../../core/feed/api'
import { supabase } from '../../lib/supabase'

export function useLists(groupId: string) {
  return useQuery({
    queryKey: ['lists', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select('*, list_items(count)')
        .eq('group_id', groupId)
        .order('kind', { ascending: false }) // preset előre
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

export type List = NonNullable<ReturnType<typeof useLists>['data']>[number]

export function useListItems(listId: string) {
  return useQuery({
    queryKey: ['list_items', listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_items')
        .select('*, adder:profiles!list_items_added_by_fkey(display_name), list_marks(user_id, rating, user:profiles(display_name))')
        .eq('list_id', listId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export type ListItem = NonNullable<ReturnType<typeof useListItems>['data']>[number]

export function useCreateList(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase.from('lists').insert({ group_id: groupId, title }).select('id').single()
      if (error) throw error
      return data.id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lists', groupId] }),
  })
}

export function useDeleteList(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lists').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lists', groupId] }),
  })
}

export function useAddListItem(list: List) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (item: { title: string; url: string | null; note: string | null }) => {
      const { data, error } = await supabase.from('list_items').insert({ ...item, list_id: list.id, group_id: list.group_id }).select('id').single()
      if (error) throw error
      await emitActivity({ groupId: list.group_id, moduleId: 'lists', type: 'item_added', refId: list.id, payload: { title: item.title, list: list.title } })
      return data.id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['list_items', list.id] }),
  })
}

export function useDeleteListItem(listId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('list_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['list_items', listId] }),
  })
}

// done=false: jelölés törlése; különben láttam (+ opcionális értékelés)
export function useSetMark(item: ListItem, uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ done, rating = null }: { done: boolean; rating?: number | null }) => {
      const { error } = done
        ? await supabase.from('list_marks').upsert({ item_id: item.id, user_id: uid, group_id: item.group_id, rating })
        : await supabase.from('list_marks').delete().match({ item_id: item.id, user_id: uid })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['list_items', item.list_id] }),
  })
}
