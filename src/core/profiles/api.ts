import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Tables } from '../../lib/database.types'
import { compressImage } from '../../lib/image'
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
    mutationFn: async (patch: Partial<Pick<Profile, 'display_name' | 'color' | 'avatar_url' | 'bank_account' | 'revolut'>>) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', uid!)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries(),
  })
}

// 256 px-es négyzetes WebP, feltöltés, publikus URL
export async function uploadAvatar(uid: string, file: File) {
  const blob = await compressImage(file, 256, true, 0.85)
  const path = `${uid}/${Date.now()}.webp`
  const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/webp' })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}
