import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Tables } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { useSession } from '../auth/auth'

export type Profile = Tables<'profiles'>

export function useMyProfile() {
  const uid = useSession()?.user.id
  return useQuery({
    queryKey: ['profile', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid!).single()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const uid = useSession()?.user.id
  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, 'display_name' | 'color' | 'avatar_url'>>) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', uid!)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries(),
  })
}

// 256 px-es WebP-re kicsinyít, feltölti, visszaadja a publikus URL-t
export async function uploadAvatar(uid: string, file: File) {
  const bitmap = await createImageBitmap(file)
  const size = 256
  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  canvas.getContext('2d')!.drawImage(bitmap, (size - bitmap.width * scale) / 2, (size - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale)
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/webp', 0.85))
  const path = `${uid}/${Date.now()}.webp`
  const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/webp' })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}
