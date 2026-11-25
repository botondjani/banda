import { CalendarCheck } from 'lucide-react'
import type { ModuleManifest } from '../../core/modules'
import { CalendarPage } from './routes'

export const calendar: ModuleManifest = {
  id: 'calendar',
  name: 'Ki ér rá?',
  description: 'Következő 6 hét, legjobb napok',
  icon: CalendarCheck,
  Page: CalendarPage,
}
