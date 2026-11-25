import { BookOpen, Film, List as ListIcon, Tv, UtensilsCrossed, type LucideIcon } from 'lucide-react'

type Preset = { icon: LucideIcon; done: string; doneCount: string; placeholder: string }

const PRESETS: Record<string, Preset> = {
  film: { icon: Film, done: 'Láttam', doneCount: 'látta', placeholder: 'Pl. Dűne: Második rész' },
  series: { icon: Tv, done: 'Láttam', doneCount: 'látta', placeholder: 'Pl. Severance' },
  book: { icon: BookOpen, done: 'Olvastam', doneCount: 'olvasta', placeholder: 'Pl. Az ötödik évszak' },
  restaurant: { icon: UtensilsCrossed, done: 'Voltam', doneCount: 'volt ott', placeholder: 'Pl. Kisüzem' },
}
const CUSTOM: Preset = { icon: ListIcon, done: 'Kipróbáltam', doneCount: 'kipróbálta', placeholder: 'Mit ajánlasz?' }

export const presetOf = (key: string | null) => (key && PRESETS[key]) || CUSTOM
