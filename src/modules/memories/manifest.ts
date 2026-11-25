import { Images } from 'lucide-react'
import type { ModuleManifest } from '../../core/modules'
import { AlbumSection } from './components/AlbumSection'
import { MemoryFeed } from './components/MemoryFeed'
import { MemoriesPage } from './routes'

export const memories: ModuleManifest = {
  id: 'memories',
  name: 'Emlékek',
  description: 'Album programonként, Egy éve ma, év végi Wrapped',
  icon: Images,
  Page: MemoriesPage,
  ProgramSection: AlbumSection,
  feed: { photos_added: MemoryFeed, one_year_ago: MemoryFeed },
  notificationTypes: [
    { type: 'photos_added', label: 'Új fotók' },
    { type: 'one_year_ago', label: 'Egy éve ma' },
  ],
}
