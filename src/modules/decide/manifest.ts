import { Dices } from 'lucide-react'
import type { ModuleManifest } from '../../core/modules'
import { DecideSheet } from './components/DecideSheet'
import { DrawFeed } from './components/DrawFeed'
import { DecidePage } from './routes'

export const decide: ModuleManifest = {
  id: 'decide',
  name: 'Döntéssegítő',
  description: 'Kerék, érme, kocka, csapatok, ki fizet',
  icon: Dices,
  Page: DecidePage,
  feed: { draw: DrawFeed },
  quickAction: { label: 'Sorsolás', meta: 'Kerék, érme, ki fizeti a kört', icon: Dices, Sheet: DecideSheet },
  notificationTypes: [{ type: 'draw', label: 'Kisorsolták, ki fizeti a kört' }],
}
