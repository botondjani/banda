import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { emitActivity } from '../../core/feed/api'
import { compressUnder } from '../../lib/image'
import { supabase } from '../../lib/supabase'

export const MAX_BYTES = 500 * 1024

export function usePhotos(programId: string) {
  return useQuery({
    queryKey: ['photos', programId],
    queryFn: async () => {
      const { data, error } = await supabase.from('photos').select('id, path, uploaded_by, size_bytes').eq('program_id', programId).order('created_at')
      if (error) throw error
      if (data.length === 0) return []
      const { data: urls, error: e2 } = await supabase.storage.from('memories').createSignedUrls(data.map((p) => p.path), 3600)
      if (e2) throw e2
      return data.map((p, i) => ({ ...p, url: urls[i]?.signedUrl ?? '' }))
    },
  })
}

export type Photo = NonNullable<ReturnType<typeof usePhotos>['data']>[number]

// Egyenként tömörít (max 1600 px, < 500 KB), feltölt, majd egy feed-esemény
export function useUploadPhotos(program: { id: string; title: string }, groupId: string, uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (files: File[]) => {
      let done = 0
      for (const file of files) {
        const blob = await compressUnder(file, MAX_BYTES)
        const path = `${groupId}/${program.id}/${uid}-${Date.now()}-${done}.webp`
        const up = await supabase.storage.from('memories').upload(path, blob, { contentType: 'image/webp' })
        if (up.error) throw up.error
        const { error } = await supabase.from('photos').insert({
          group_id: groupId, program_id: program.id, path, size_bytes: blob.size, taken_at: new Date(file.lastModified).toISOString(),
        })
        if (error) throw error
        done++
      }
      await emitActivity({
        groupId, moduleId: 'memories', type: 'photos_added', refId: program.id,
        payload: { title: program.title, count: done, notify_text: `feltöltött ${done} fotót: ${program.title}`, notify_url: `/programs/${program.id}` },
      })
      return done
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos', program.id] }),
  })
}

export function useDeletePhoto(programId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (photo: Photo) => {
      const { error } = await supabase.from('photos').delete().eq('id', photo.id)
      if (error) throw error
      await supabase.storage.from('memories').remove([photo.path])
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos', programId] }),
  })
}

export function useAlbums(groupId: string) {
  return useQuery({
    queryKey: ['albums', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, title, starts_at, created_at, photos(count)')
        .eq('group_id', groupId)
        .neq('status', 'idea')
        .order('starts_at', { ascending: false, nullsFirst: false })
      if (error) throw error
      return data.map((p) => ({ ...p, photoCount: p.photos[0]?.count ?? 0 })).filter((p) => p.photoCount > 0)
    },
  })
}

export type WrappedData = {
  year: number
  programs: number
  top_attendee: { name: string; count: number } | null
  photos: number
  top_photographer: { name: string; count: number } | null
  spent: number
  biggest_expense: { title: string; amount: number } | null
  pings: number
  top_tag: string | null
  draws: number
  top_payer: { name: string; count: number } | null
  challenges_completed: number
  bets: number
  top_xp: { name: string; xp: number } | null
  top_item: { title: string; rating: number } | null
}

// Minden szám a szerver wrapped() függvényéből
export function useWrapped(groupId: string, year: number | null) {
  return useQuery({
    queryKey: ['wrapped', groupId, year],
    enabled: year !== null,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('wrapped', { gid: groupId, yr: year! })
      if (error) throw error
      return data as unknown as WrappedData
    },
  })
}
