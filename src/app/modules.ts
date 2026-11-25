import type { ModuleManifest } from '../core/modules'
import { available } from '../modules/available/manifest'
import { bring } from '../modules/bring/manifest'
import { calendar } from '../modules/calendar/manifest'

// Sorrend = megjelenési sorrend (Modulok lista, gyorsakciók)
export const modules: ModuleManifest[] = [available, calendar, bring]
