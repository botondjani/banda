import { Trophy } from 'lucide-react'
import type { ModuleManifest } from '../../core/modules'
import { LeaguePage } from './routes'

export const league: ModuleManifest = {
  id: 'league',
  name: 'Liga & díjak',
  description: 'XP-ranglista, havi díjak, év végi díjátadó',
  icon: Trophy,
  Page: LeaguePage,
}
