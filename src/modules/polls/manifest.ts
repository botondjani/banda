import { Vote } from 'lucide-react'
import type { ModuleManifest } from '../../core/modules'
import { NewPollSheet } from './components/NewPollSheet'
import { PollFeed } from './components/PollFeed'
import { PollsPage } from './routes'

export const polls: ModuleManifest = {
  id: 'polls',
  name: 'Szavazás',
  description: 'Gyors kérdés, több lehetőség, határidő',
  icon: Vote,
  Page: PollsPage,
  feed: { poll_created: PollFeed },
  quickAction: { label: 'Szavazás', meta: 'Hova menjünk? Mikor?', icon: Vote, Sheet: NewPollSheet },
  notificationTypes: [{ type: 'poll_created', label: 'Új szavazás' }],
}
