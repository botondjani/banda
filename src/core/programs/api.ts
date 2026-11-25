import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { patchCache } from '../../lib/optimistic'
import { supabase } from '../../lib/supabase'
import { useSession } from '../auth/auth'
import { emitActivity } from '../feed/api'

export type Attendance = 'going' | 'maybe' | 'no'

export function usePrograms(groupId: string) {
  return useQuery({
    queryKey: ['programs', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*, program_attendees(user_id, status)')
        .eq('group_id', groupId)
        .neq('status', 'idea')
        .order('starts_at', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data
    },
  })
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ['program', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*, program_attendees(status, user:profiles(id, display_name, avatar_url, color))')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })
}

type NewProgram = { groupId: string; title: string; startsAt: string | null; location: string | null }

export function useCreateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ groupId, title, startsAt, location }: NewProgram) => {
      const { data, error } = await supabase
        .from('programs')
        .insert({ group_id: groupId, title, starts_at: startsAt, location })
        .select('id')
        .single()
      if (error) throw error
      await emitActivity({ groupId, type: 'program_created', refId: data.id, payload: { title, starts_at: startsAt } })
      return data.id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  })
}

export function useSetAttendance(programId: string) {
  const qc = useQueryClient()
  const uid = useSession()?.user.id
  type Program = NonNullable<ReturnType<typeof useProgram>['data']>
  return useMutation({
    onMutate: async (status: Attendance) => ({
      rollback: await patchCache<Program>(qc, ['program', programId], (p) => ({
        ...p,
        program_attendees: p.program_attendees.map((a) => (a.user?.id === uid ? { ...a, status } : a)),
      })),
    }),
    onError: (_e, _v, ctx) => ctx?.rollback(),
    mutationFn: async (status: Attendance) => {
      const { error } = await supabase.from('program_attendees').upsert({ program_id: programId, user_id: uid, status })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['program', programId] }),
  })
}
