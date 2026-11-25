import type { ModuleManifest } from '../core/modules'
import { available } from '../modules/available/manifest'
import { bring } from '../modules/bring/manifest'
import { calendar } from '../modules/calendar/manifest'
import { decide } from '../modules/decide/manifest'
import { lists } from '../modules/lists/manifest'
import { money } from '../modules/money/manifest'

// Sorrend = megjelenési sorrend (Modulok lista, gyorsakciók)
export const modules: ModuleManifest[] = [available, money, decide, calendar, bring, lists]
