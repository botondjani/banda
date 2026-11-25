import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, type LucideIcon } from 'lucide-react'
import { useForecast } from '../../lib/weather'

// WMO időjárás-kód -> ikon + szöveg
function describe(code: number): [LucideIcon, string] {
  if (code === 0) return [Sun, 'derült']
  if (code <= 2) return [CloudSun, 'részben felhős']
  if (code <= 48) return [Cloud, 'felhős']
  if (code <= 57) return [CloudDrizzle, 'szitálás']
  if (code <= 67 || (code >= 80 && code <= 82)) return [CloudRain, 'eső']
  if (code <= 77 || code === 85 || code === 86) return [CloudSnow, 'havazás']
  return [CloudLightning, 'zivatar']
}

export function WeatherLine({ location, startsAt }: { location: string | null; startsAt: string | null }) {
  const { data } = useForecast(location, startsAt)
  if (!data) return null
  const [Icon, text] = describe(data.code)
  return (
    <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
      <Icon size={18} strokeWidth={1.75} aria-hidden />
      <span>
        <span className="font-semibold text-ink tabular-nums">{data.temp}°</span> · {text} · eső {data.rain}% <span className="sr-only">({data.place})</span>
      </span>
    </p>
  )
}
