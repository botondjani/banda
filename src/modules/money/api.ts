import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { emitActivity } from '../../core/feed/api'
import { formatFt } from '../../lib/format'
import { supabase } from '../../lib/supabase'

export type SplitMode = 'equal' | 'exact' | 'shares'

// Egyenlegek és nullázás: a szerver számolja (balances view, settle_plan)
export function useBalances(groupId: string) {
  return useQuery({
    queryKey: ['money', groupId, 'balances'],
    queryFn: async () => {
      const { data, error } = await supabase.from('balances').select('user_id, balance').eq('group_id', groupId)
      if (error) throw error
      return Object.fromEntries(data.map((b) => [b.user_id, b.balance]))
    },
  })
}

export function useSettlePlan(groupId: string) {
  return useQuery({
    queryKey: ['money', groupId, 'plan'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('settle_plan', { gid: groupId })
      if (error) throw error
      return data
    },
  })
}

export function useExpenses(groupId: string, programId?: string) {
  return useQuery({
    queryKey: ['money', groupId, 'expenses', programId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('expenses')
        .select('*, payer:profiles!expenses_paid_by_fkey(display_name), expense_splits(user_id, amount)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
      if (programId) q = q.eq('program_id', programId)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export type Expense = NonNullable<ReturnType<typeof useExpenses>['data']>[number]

type NewExpense = { title: string; amount: number; paidBy: string; mode: SplitMode; parts: Record<string, number>; programId?: string }

export function useAddExpense(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, amount, paidBy, mode, parts, programId }: NewExpense) => {
      const { data: id, error } = await supabase.rpc('add_expense', {
        gid: groupId, title, amount, paid_by: paidBy, mode, parts, program: programId ?? null,
      })
      if (error) throw error
      await emitActivity({
        groupId,
        moduleId: 'money',
        type: 'expense_added',
        refId: id,
        payload: { title, amount, notify_text: `felvett egy kiadást: ${title} (${formatFt(amount)})`, notify_url: '/m/money' },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money', groupId] }),
  })
}

export function useSettle(groupId: string, uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ from, to, amount }: { from: string; to: string; amount: number }) => {
      const { error } = await supabase.from('settlements').insert({ group_id: groupId, from_user: from, to_user: to, amount })
      if (error) throw error
      const other = uid === from ? to : from
      await emitActivity({
        groupId,
        moduleId: 'money',
        type: 'settled',
        payload: {
          from, to, amount,
          notify_to: other,
          notify_text: uid === from ? `kifizetett neked ${formatFt(amount)}-ot.` : `rögzítette, hogy megkapta tőled a ${formatFt(amount)}-ot.`,
          notify_url: '/m/money',
        },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money', groupId] }),
  })
}

export function useDeleteExpense(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['money', groupId] }),
  })
}
