import { Flame } from 'lucide-react'
import type { ModuleManifest } from '../../core/modules'
import { ChallengeFeed } from './components/ChallengeFeed'
import { ChallengesPage } from './routes'

export const challenges: ModuleManifest = {
  id: 'challenges',
  name: 'Kihívások',
  description: 'Heti kihívás, fotós bizonyíték, szavazás',
  icon: Flame,
  Page: ChallengesPage,
  feed: { challenge_created: ChallengeFeed, challenge_submitted: ChallengeFeed, challenge_completed: ChallengeFeed },
  notificationTypes: [
    { type: 'challenge_created', label: 'Új kihívás' },
    { type: 'challenge_submitted', label: 'Bizonyíték érkezett' },
    { type: 'challenge_completed', label: 'Valaki teljesített egy kihívást' },
    { type: 'challenge_rejected', label: 'Nem fogadták el a bizonyítékod' },
  ],
}
