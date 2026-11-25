import type { ModuleManifest } from '../core/modules'
import { available } from '../modules/available/manifest'
import { bets } from '../modules/bets/manifest'
import { bring } from '../modules/bring/manifest'
import { calendar } from '../modules/calendar/manifest'
import { challenges } from '../modules/challenges/manifest'
import { decide } from '../modules/decide/manifest'
import { ideas } from '../modules/ideas/manifest'
import { league } from '../modules/league/manifest'
import { lending } from '../modules/lending/manifest'
import { lists } from '../modules/lists/manifest'
import { memories } from '../modules/memories/manifest'
import { money } from '../modules/money/manifest'

// Sorrend = megjelenési sorrend (Modulok lista, gyorsakciók)
export const modules: ModuleManifest[] = [available, money, decide, ideas, calendar, bring, lists, challenges, bets, league, memories, lending]
