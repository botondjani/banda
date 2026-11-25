import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { emitActivity } from '../../core/feed/api'
import { compressImage } from '../../lib/image'
import { supabase } from '../../lib/supabase'

export function useChallenges(groupId: string) {
  return useQuery({
    queryKey: ['challenges', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select(
          '*, creator:profiles!challenges_created_by_fkey(display_name), challenge_submissions(id, user_id, photo_path, note, status, created_at, user:profiles!challenge_submissions_user_id_fkey(display_name), submission_votes(user_id, valid))',
        )
        .eq('group_id', groupId)
        .order('ends_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data
    },
  })
}

export type Challenge = NonNullable<ReturnType<typeof useChallenges>['data']>[number]
export type Submission = Challenge['challenge_submissions'][number]

export function useCreateChallenge(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, description, days }: { title: string; description: string | null; days: number }) => {
      const ends_at = new Date(Date.now() + days * 86400_000).toISOString()
      const { data, error } = await supabase.from('challenges').insert({ group_id: groupId, title, description, ends_at }).select('id').single()
      if (error) throw error
      await emitActivity({
        groupId, moduleId: 'challenges', type: 'challenge_created', refId: data.id,
        payload: { title, notify_text: `új kihívást indított: ${title}`, notify_url: '/m/challenges' },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenges', groupId] }),
  })
}

// Fotó: max 1600 px WebP, privát bucketbe (<group>/<user>/<idő>.webp)
export function useSubmit(groupId: string, uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ challenge, file, note }: { challenge: Challenge; file: File; note: string | null }) => {
      const blob = await compressImage(file, 1600)
      const path = `${groupId}/${uid}/${Date.now()}.webp`
      const up = await supabase.storage.from('challenges').upload(path, blob, { contentType: 'image/webp' })
      if (up.error) throw up.error
      const { error } = await supabase.from('challenge_submissions').insert({ challenge_id: challenge.id, group_id: groupId, user_id: uid, photo_path: path, note })
      if (error) throw error
      await emitActivity({
        groupId, moduleId: 'challenges', type: 'challenge_submitted', refId: challenge.id,
        payload: { title: challenge.title, notify_text: `beküldte a bizonyítékot: ${challenge.title}. Ér?`, notify_url: '/m/challenges' },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenges', groupId] }),
  })
}

export function useVoteSubmission(groupId: string, uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ submissionId, valid }: { submissionId: string; valid: boolean }) => {
      const { error } = await supabase.from('submission_votes').upsert({ submission_id: submissionId, user_id: uid, group_id: groupId, valid })
      if (error) throw error
    },
    // eldőlhet -> XP, feed is változik
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function usePhotoUrl(path: string) {
  return useQuery({
    queryKey: ['photo', path],
    staleTime: 50 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('challenges').createSignedUrl(path, 3600)
      if (error) throw error
      return data.signedUrl
    },
  })
}
