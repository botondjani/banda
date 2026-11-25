import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

// XP-t a szerver számol (xp_ledger trigger, league_standings view)
export function useStandings(groupId: string) {
  return useQuery({
    queryKey: ['xp', groupId, 'standings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('league_standings').select('user_id, season_xp, total_xp').eq('group_id', groupId)
      if (error) throw error
      return data
    },
  })
}

export function useBadges(groupId: string, userId: string) {
  return useQuery({
    queryKey: ['xp', groupId, 'badges', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_badges').select('key, label, description').eq('group_id', groupId).eq('user_id', userId)
      if (error) throw error
      return data
    },
  })
}

// Szezon = naptári negyedév, pl. "2026 Q4"
export function seasonLabel(d = new Date()) {
  return `${d.getFullYear()} Q${Math.floor(d.getMonth() / 3) + 1}`
}
