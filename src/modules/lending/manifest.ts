import { Wrench } from 'lucide-react'
import type { ModuleManifest } from '../../core/modules'
import { LendingFeed } from './components/LendingFeed'
import { LendingPage } from './routes'

export const lending: ModuleManifest = {
  id: 'lending',
  name: 'Kölcsönző',
  description: 'Ki mit ad kölcsön, kinél van, mikorra kell vissza',
  icon: Wrench,
  Page: LendingPage,
  feed: { item_added: LendingFeed, loan_requested: LendingFeed, loan_approved: LendingFeed, loan_declined: LendingFeed, loan_returned: LendingFeed },
  notificationTypes: [
    { type: 'loan_requested', label: 'Valaki elkérne tőled valamit' },
    { type: 'loan_approved', label: 'Odaadják, amit kértél' },
    { type: 'loan_overdue', label: 'Lejárt kölcsönzés' },
  ],
}
