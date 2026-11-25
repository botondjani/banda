import { Beer, Coins, Dice5, Disc3, Hash, Shuffle, Users, type LucideIcon } from 'lucide-react'
import type { Kind } from './api'

export const MODES: { kind: Kind; label: string; meta: string; icon: LucideIcon; action: string }[] = [
  { kind: 'wheel', label: 'Kerék', meta: 'Hova menjünk? Mit együnk?', icon: Disc3, action: 'Pörgesd' },
  { kind: 'pay', label: 'Ki fizeti a kört?', meta: 'Valakinek muszáj', icon: Beer, action: 'Sorsolj' },
  { kind: 'coin', label: 'Érme', meta: 'Fej vagy írás', icon: Coins, action: 'Dobd fel' },
  { kind: 'dice', label: 'Kocka', meta: '1–5 kocka', icon: Dice5, action: 'Dobj' },
  { kind: 'number', label: 'Számhúzás', meta: 'Szám két érték között', icon: Hash, action: 'Húzz' },
  { kind: 'shuffle', label: 'Sorrend', meta: 'Ki kezd, ki következik', icon: Shuffle, action: 'Keverd' },
  { kind: 'teams', label: 'Csapatok', meta: 'Igazságos(nak tűnő) felosztás', icon: Users, action: 'Sorsolj' },
]
