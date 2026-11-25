import { Handshake } from 'lucide-react'
import type { ModuleManifest } from '../../core/modules'
import { BetFeed } from './components/BetFeed'
import { NewBetSheet } from './components/NewBetSheet'
import { BetsPage } from './routes'

export const bets: ModuleManifest = {
  id: 'bets',
  name: 'Fogadás',
  description: '„Fogadjunk, hogy…” – tét, tipp, szavazás',
  icon: Handshake,
  Page: BetsPage,
  feed: { bet_created: BetFeed, bet_resolved: BetFeed, bet_won: BetFeed },
  quickAction: { label: 'Fogadás', meta: 'Fogadjunk, hogy…', icon: Handshake, Sheet: NewBetSheet },
  notificationTypes: [
    { type: 'bet_created', label: 'Új fogadás' },
    { type: 'bet_resolved', label: 'Eldőlt egy fogadás' },
  ],
}
