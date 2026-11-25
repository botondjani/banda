import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { emitActivity } from '../../core/feed/api'
import { patchCache } from '../../lib/optimistic'
import { supabase } from '../../lib/supabase'

export type Vote = 'in' | 'pass'

export function useIdeas(groupId: string) {
  return useQuery({
    queryKey: ['ideas', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, title, created_at, creator:profiles!programs_created_by_fkey(display_name), idea_votes(user_id, vote)')
        .eq('group_id', groupId)
        .eq('status', 'idea')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export type Idea = NonNullable<ReturnType<typeof useIdeas>['data']>[number]

// A küszöböt a szerver számolja (beállítás vagy least(3, létszám))
export function useThreshold(groupId: string) {
  return useQuery({
    queryKey: ['ideas', groupId, 'threshold'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('idea_threshold', { gid: groupId })
      if (error) throw error
      return data
    },
  })
}

export function useSetThreshold(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (threshold: number) => {
      const { error } = await supabase.from('group_modules').upsert({ group_id: groupId, module_id: 'ideas', enabled: true, settings: { threshold } })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ideas', groupId] }),
  })
}

export function useAddIdea(groupId: string, uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase.from('programs').insert({ group_id: groupId, title, status: 'idea' }).select('id').single()
      if (error) throw error
      await emitActivity({
        groupId,
        moduleId: 'ideas',
        type: 'idea_added',
        refId: data.id,
        payload: { title, notify_text: `új ötletet dobott be: ${title}. Benne vagy?`, notify_url: '/m/ideas' },
      })
      // az ötletgazda benne van (küszöb 1-nél ez már programmá teszi)
      const { error: e2 } = await supabase.from('idea_votes').insert({ program_id: data.id, user_id: uid, group_id: groupId, vote: 'in' })
      if (e2) throw e2
    },
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useVote(groupId: string, uid: string) {
  const qc = useQueryClient()
  return useMutation({
    // a kártya azonnal továbblép
    onMutate: async ({ ideaId, vote }: { ideaId: string; vote: Vote }) => ({
      rollback: await patchCache<Idea[]>(qc, ['ideas', groupId], (ideas) =>
        ideas.map((i) => (i.id !== ideaId ? i : { ...i, idea_votes: [...i.idea_votes.filter((v) => v.user_id !== uid), { user_id: uid, vote }] })),
      ),
    }),
    onError: (_e, _v, ctx) => ctx?.rollback(),
    mutationFn: async ({ ideaId, vote }: { ideaId: string; vote: Vote }) => {
      const { error } = await supabase.from('idea_votes').upsert({ program_id: ideaId, user_id: uid, group_id: groupId, vote })
      if (error) throw error
    },
    // küszöbnél program lesz belőle -> programlista, feed is frissül
    onSettled: () => qc.invalidateQueries(),
  })
}
