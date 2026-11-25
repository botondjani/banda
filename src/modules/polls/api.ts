import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { emitActivity } from '../../core/feed/api'
import { patchCache } from '../../lib/optimistic'
import { supabase } from '../../lib/supabase'

export function usePolls(groupId: string) {
  return useQuery({
    queryKey: ['polls', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('polls')
        .select('*, creator:profiles!polls_created_by_fkey(display_name), poll_options(id, label, position), poll_votes(option_id, user_id)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data.map((p) => ({ ...p, poll_options: [...p.poll_options].sort((a, b) => a.position - b.position) }))
    },
  })
}

export type Poll = NonNullable<ReturnType<typeof usePolls>['data']>[number]
export const isOpen = (p: Poll) => !p.closes_at || new Date(p.closes_at).getTime() > Date.now()

type NewPoll = { question: string; options: string[]; multi: boolean; closesAt: string | null }

export function useCreatePoll(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ question, options, multi, closesAt }: NewPoll) => {
      const { data: id, error } = await supabase.rpc('create_poll', { gid: groupId, question, options, multi, closes_at: closesAt })
      if (error) throw error
      await emitActivity({
        groupId, moduleId: 'polls', type: 'poll_created', refId: id,
        payload: { question, notify_text: `szavazást indított: ${question}`, notify_url: '/m/polls' },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['polls', groupId] }),
  })
}

// A saját szavazatok cseréje (szerver ellenőrzi: nyitott-e, egy vagy több választás)
export function useVotePoll(groupId: string, uid: string) {
  const qc = useQueryClient()
  return useMutation({
    onMutate: async ({ pollId, optionIds }: { pollId: string; optionIds: string[] }) => ({
      rollback: await patchCache<Poll[]>(qc, ['polls', groupId], (polls) =>
        polls.map((p) =>
          p.id !== pollId ? p : { ...p, poll_votes: [...p.poll_votes.filter((v) => v.user_id !== uid), ...optionIds.map((option_id) => ({ option_id, user_id: uid }))] },
        ),
      ),
    }),
    onError: (_e, _v, ctx) => ctx?.rollback(),
    mutationFn: async ({ pollId, optionIds }: { pollId: string; optionIds: string[] }) => {
      const { error } = await supabase.rpc('vote_poll', { pid: pollId, option_ids: optionIds })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['polls', groupId] }),
  })
}
