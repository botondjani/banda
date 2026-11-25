import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Json } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'

export type Kind = 'wheel' | 'coin' | 'dice' | 'number' | 'shuffle' | 'teams' | 'pay'

export type DrawResult = {
  index?: number
  value?: string | number
  side?: string
  rolls?: number[]
  order?: string[]
  teams?: string[][]
  user_id?: string
  name?: string
}
export type DrawOptions = { items?: string[]; count?: number; min?: number; max?: number; teams?: number; user_ids?: string[] }

export function useDraws(groupId: string) {
  return useQuery({
    queryKey: ['draws', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('draws')
        .select('id, kind, options, result, created_at, creator:profiles(display_name)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data.map((d) => ({ ...d, kind: d.kind as Kind, options: d.options as DrawOptions, result: d.result as DrawResult }))
    },
  })
}

export type Draw = NonNullable<ReturnType<typeof useDraws>['data']>[number]

// A szerver húz; visszaadjuk a tárolt sort, az animáció ebből dolgozik
export function useDraw(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ kind, options }: { kind: Kind; options: DrawOptions }) => {
      const { data: id, error } = await supabase.rpc('draw', { gid: groupId, kind, options: options as Json })
      if (error) throw error
      const { data, error: e2 } = await supabase.from('draws').select('result').eq('id', id).single()
      if (e2) throw e2
      return data.result as DrawResult
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['draws', groupId] }),
  })
}

// Egysoros összefoglaló (feed, előzmények)
export function describeDraw(kind: Kind, r: DrawResult, o: DrawOptions) {
  switch (kind) {
    case 'wheel':
      return `kereket pörgetett: ${r.value}`
    case 'coin':
      return `érmét dobott: ${r.side}`
    case 'dice': {
      const rolls = r.rolls ?? []
      return `dobott: ${rolls.join(' + ')}${rolls.length > 1 ? ` = ${rolls.reduce((a, b) => a + b, 0)}` : ''}`
    }
    case 'number':
      return `számot húzott (${o.min}–${o.max}): ${r.value}`
    case 'shuffle':
      return `sorrendet kevert: ${(r.order ?? []).join(', ')}`
    case 'teams':
      return `csapatokat sorsolt: ${(r.teams ?? []).map((t) => t.join(', ')).join(' | ')}`
    case 'pay':
      return `sorsolt: ${r.name} fizeti a kört!`
  }
}
