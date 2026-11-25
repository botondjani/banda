import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { emitActivity } from '../../core/feed/api'
import { formatFt } from '../../lib/format'
import { supabase } from '../../lib/supabase'

export function useBets(groupId: string) {
  return useQuery({
    queryKey: ['bets', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bets')
        .select('*, creator:profiles!bets_created_by_fkey(display_name), bet_sides(id, label), bet_picks(user_id, side_id, user:profiles!bet_picks_user_id_fkey(display_name)), bet_votes(user_id, side_id)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data
    },
  })
}

export type Bet = NonNullable<ReturnType<typeof useBets>['data']>[number]

type NewBet = { title: string; sides: string[]; stake: string | null; stakeAmount: number | null; toKassza: boolean }

export function useCreateBet(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, sides, stake, stakeAmount, toKassza }: NewBet) => {
      const { data: id, error } = await supabase.rpc('create_bet', {
        gid: groupId, title, sides, stake, stake_amount: stakeAmount, to_kassza: toKassza,
      })
      if (error) throw error
      const what = [stake, stakeAmount && formatFt(stakeAmount)].filter(Boolean).join(', ')
      await emitActivity({
        groupId, moduleId: 'bets', type: 'bet_created', refId: id,
        payload: { title, notify_text: `fogadást ajánlott: ${title}${what ? ` (tét: ${what})` : ''}`, notify_url: '/m/bets' },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bets', groupId] }),
  })
}

export function usePick(groupId: string, uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ betId, sideId }: { betId: string; sideId: string }) => {
      const { error } = await supabase.from('bet_picks').upsert({ bet_id: betId, user_id: uid, group_id: groupId, side_id: sideId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bets', groupId] }),
  })
}

export function useCloseBet(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (betId: string) => {
      const { error } = await supabase.rpc('close_bet', { bid: betId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bets', groupId] }),
  })
}

// Többségi szavazat dönt (szerver), a tét ekkor kerülhet a kasszába
export function useVoteBet(groupId: string, uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ betId, sideId }: { betId: string; sideId: string }) => {
      const { error } = await supabase.from('bet_votes').upsert({ bet_id: betId, user_id: uid, group_id: groupId, side_id: sideId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries(),
  })
}
