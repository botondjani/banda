import { Lightbulb } from 'lucide-react'
import type { ModuleManifest } from '../../core/modules'
import { IdeaAddedFeed, IdeaPlannedFeed } from './components/IdeaFeed'
import { NewIdeaSheet } from './components/NewIdeaSheet'
import { IdeasPage } from './routes'

export const ideas: ModuleManifest = {
  id: 'ideas',
  name: 'Ötletbank',
  description: 'Bedobod, a többiek swipe-olnak, és kész a program',
  icon: Lightbulb,
  Page: IdeasPage,
  feed: { idea_added: IdeaAddedFeed, idea_planned: IdeaPlannedFeed },
  quickAction: { label: 'Ötlet', meta: 'Mi lenne jó legközelebb?', icon: Lightbulb, Sheet: NewIdeaSheet },
  notificationTypes: [
    { type: 'idea_added', label: 'Új ötlet' },
    { type: 'idea_planned', label: 'Ötletből program lett' },
  ],
}
