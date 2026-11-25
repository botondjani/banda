import { ListChecks } from 'lucide-react'
import type { ModuleManifest } from '../../core/modules'
import { ItemFeed } from './components/ItemFeed'
import { ListsPage } from './routes'

export const lists: ModuleManifest = {
  id: 'lists',
  name: 'Listák',
  description: 'Filmek, sorozatok, könyvek, éttermek, saját listák',
  icon: ListChecks,
  Page: ListsPage,
  feed: { item_added: ItemFeed },
}
