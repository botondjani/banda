import { Zap } from 'lucide-react'
import type { ModuleManifest } from '../../core/modules'
import { PingFeed, PingJoinedFeed } from './components/PingFeed'
import { PingSheet } from './components/PingSheet'
import { TodayStrip } from './components/TodayStrip'
import { AvailablePage } from './routes'

export const available: ModuleManifest = {
  id: 'available',
  name: 'Ráérek most',
  description: 'Szólj, ha ma ráérsz, és ki csatlakozik',
  icon: Zap,
  Page: AvailablePage,
  feed: { ping: PingFeed, ping_joined: PingJoinedFeed },
  FeedTop: TodayStrip,
  quickAction: { label: 'Ráérek most', meta: 'Sör, kaja, futás – ki jön?', icon: Zap, Sheet: PingSheet },
  notificationTypes: [
    { type: 'ping', label: 'Valaki ráér' },
    { type: 'ping_joined', label: 'Csatlakoztak a ráérésedhez' },
  ],
}
