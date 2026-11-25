import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function useCategories(groupId: string) {
  return useQuery({
    queryKey: ['awards', groupId, 'categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('award_categories').select('id, title, created_by').eq('group_id', groupId).order('created_at')
      if (error) throw error
      return data
    },
  })
}

// Eredmény a szerverről (award_results view): hónap, jelölt, szavazat, helyezés
export function useResults(groupId: string) {
  return useQuery({
    queryKey: ['awards', groupId, 'results'],
    queryFn: async () => {
      const { data, error } = await supabase.from('award_results').select('*').eq('group_id', groupId)
      if (error) throw error
      return data
    },
  })
}

export function useMyVotes(groupId: string, uid: string) {
  return useQuery({
    queryKey: ['awards', groupId, 'my', currentMonth()],
    queryFn: async () => {
      const { data, error } = await supabase.from('award_votes').select('category_id, nominee_id').eq('group_id', groupId).eq('voter_id', uid).eq('month', currentMonth())
      if (error) throw error
      return Object.fromEntries(data.map((v) => [v.category_id, v.nominee_id]))
    },
  })
}

export function useVoteAward(groupId: string, uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ categoryId, nomineeId }: { categoryId: string; nomineeId: string }) => {
      const { error } = await supabase
        .from('award_votes')
        .upsert({ category_id: categoryId, group_id: groupId, month: currentMonth(), voter_id: uid, nominee_id: nomineeId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['awards', groupId] }),
  })
}

export function useAddCategory(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase.from('award_categories').insert({ group_id: groupId, title })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['awards', groupId] }),
  })
}
