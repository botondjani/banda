import { ShoppingBasket } from 'lucide-react'
import type { ModuleManifest } from '../../core/modules'
import { BringSection } from './components/BringSection'
import { BringPage } from './routes'

export const bring: ModuleManifest = {
  id: 'bring',
  name: 'Ki mit hoz',
  description: 'Kaja, pia, felszerelés programonként',
  icon: ShoppingBasket,
  Page: BringPage,
  ProgramSection: BringSection,
}
