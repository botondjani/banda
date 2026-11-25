import { Wallet } from 'lucide-react'
import type { ModuleManifest } from '../../core/modules'
import { ExpenseSheet } from './components/ExpenseSheet'
import { MoneySection } from './components/MoneySection'
import { ExpenseFeed, SettledFeed } from './components/MoneyFeed'
import { MoneyPage } from './routes'

export const money: ModuleManifest = {
  id: 'money',
  name: 'Kassza',
  description: 'Ki mennyit fizetett, ki kinek tartozik',
  icon: Wallet,
  Page: MoneyPage,
  feed: { expense_added: ExpenseFeed, settled: SettledFeed },
  ProgramSection: MoneySection,
  quickAction: { label: 'Új kiadás', meta: 'Kifizettél valamit a bandának', icon: Wallet, Sheet: ExpenseSheet },
  notificationTypes: [
    { type: 'expense_added', label: 'Új kiadás a kasszában' },
    { type: 'settled', label: 'Rendezett tartozás' },
  ],
}
