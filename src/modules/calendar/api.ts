import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export type DayState = 'free' | 'maybe' | 'busy'
export const WEEKS = 6

// Helyi dátum YYYY-MM-DD formában
export function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// A mostani hét hétfőjétől 6 hét
export function calendarDays() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return Array.from({ length: WEEKS * 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
}

export function useFreeDays(groupId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['free_days', groupId, from],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('free_days')
        .select('day, state, user_id, user:profiles(display_name)')
        .eq('group_id', groupId)
        .gte('day', from)
        .lte('day', to)
      if (error) throw error
      return data
    },
  })
}

export function useSetDay(groupId: string, uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ day, state }: { day: string; state: DayState | null }) => {
      const { error } = state
        ? await supabase.from('free_days').upsert({ group_id: groupId, user_id: uid, day, state })
        : await supabase.from('free_days').delete().match({ group_id: groupId, user_id: uid, day })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['free_days', groupId] }),
  })
}
