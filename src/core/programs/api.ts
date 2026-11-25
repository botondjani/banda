import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
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

export type Recurrence = 'weekly' | 'biweekly' | 'monthly'
type NewProgram = { groupId: string; title: string; startsAt: string | null; location: string | null; recurrence?: Recurrence | null }

export function useCreateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ groupId, title, startsAt, location, recurrence = null }: NewProgram) => {
      const { data, error } = await supabase
        .from('programs')
        .insert({ group_id: groupId, title, starts_at: startsAt, location, recurrence: startsAt ? recurrence : null })
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

// Sorozat leállítása: a következő alkalom már nem jön létre
export function useStopRecurrence(programId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (seriesId: string) => {
      const { error } = await supabase.from('programs').update({ recurrence: null }).eq('series_id', seriesId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['program', programId] }),
  })
}

// Program-beszélgetés; realtime csak a nyitott programra
export function useProgramComments(programId: string) {
  const qc = useQueryClient()
  useEffect(() => {
    const channel = supabase
      .channel(`program-comments:${programId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'program_comments', filter: `program_id=eq.${programId}` }, () =>
        qc.invalidateQueries({ queryKey: ['program_comments', programId] }),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [programId, qc])

  return useQuery({
    queryKey: ['program_comments', programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_comments')
        .select('id, body, created_at, user_id, user:profiles(display_name, avatar_url, color)')
        .eq('program_id', programId)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

export function useAddProgramComment(programId: string, groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from('program_comments').insert({ program_id: programId, group_id: groupId, body })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['program_comments', programId] }),
  })
}
