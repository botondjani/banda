import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { emitActivity } from '../../core/feed/api'
import { supabase } from '../../lib/supabase'

export function useLendItems(groupId: string) {
  return useQuery({
    queryKey: ['lending', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lend_items')
        .select('*, owner:profiles!lend_items_owner_id_fkey(display_name), loans(id, borrower_id, status, due_date, created_at, borrower:profiles!loans_borrower_id_fkey(display_name))')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
      if (error) throw error
      // a nyitott (kért / aktív) kölcsönzés, ha van
      return data.map((i) => ({ ...i, open: i.loans.find((l) => l.status === 'requested' || l.status === 'active') ?? null }))
    },
  })
}

export type LendItem = NonNullable<ReturnType<typeof useLendItems>['data']>[number]
export type Loan = NonNullable<LendItem['open']>

// "dec. 2" (pont nélkül, hogy a -ig rag mögé illeszthető legyen)
const dueLabel = (iso: string) => new Date(`${iso}T12:00`).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }).replace(/\.$/, '')

export function useAddLendItem(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, note }: { name: string; note: string | null }) => {
      const { data, error } = await supabase.from('lend_items').insert({ group_id: groupId, name, note }).select('id').single()
      if (error) throw error
      await emitActivity({ groupId, moduleId: 'lending', type: 'item_added', refId: data.id, payload: { name } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lending', groupId] }),
  })
}

export function useDeleteLendItem(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lend_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lending', groupId] }),
  })
}

export function useRequestLoan(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ item, due }: { item: LendItem; due: string }) => {
      const { data: id, error } = await supabase.rpc('request_loan', { iid: item.id, due })
      if (error) throw error
      await emitActivity({
        groupId, moduleId: 'lending', type: 'loan_requested', refId: id,
        payload: { name: item.name, notify_to: item.owner_id, notify_text: `elkérné: ${item.name} (${dueLabel(due)}-ig)`, notify_url: '/m/lending' },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lending', groupId] }),
  })
}

export function useRespondLoan(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ item, loan, approve }: { item: LendItem; loan: Loan; approve: boolean }) => {
      const { error } = await supabase.rpc('respond_loan', { lid: loan.id, approve })
      if (error) throw error
      await emitActivity({
        groupId, moduleId: 'lending', type: approve ? 'loan_approved' : 'loan_declined', refId: loan.id,
        payload: {
          name: item.name, borrower: loan.borrower?.display_name, notify_to: loan.borrower_id,
          notify_text: approve ? `odaadja neked: ${item.name}. ${dueLabel(loan.due_date)}-ig a tiéd.` : `most nem tudja odaadni: ${item.name}.`,
          notify_url: '/m/lending',
        },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lending', groupId] }),
  })
}

export function useReturnLoan(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ item, loan }: { item: LendItem; loan: Loan }) => {
      const { error } = await supabase.rpc('return_loan', { lid: loan.id })
      if (error) throw error
      await emitActivity({ groupId, moduleId: 'lending', type: 'loan_returned', refId: loan.id, payload: { name: item.name, borrower: loan.borrower?.display_name } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lending', groupId] }),
  })
}

export { dueLabel }
