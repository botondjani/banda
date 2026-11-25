import { useQuery } from '@tanstack/react-query'

// Időjárás az Open-Meteo ingyenes, kulcs nélküli API-jából: a helyszín nevét geokódoljuk,
// majd a kezdés órájára kérünk előrejelzést (max. 15 napra előre).
export type Forecast = { temp: number; rain: number; code: number; place: string }

export function useForecast(location: string | null, startsAt: string | null) {
  const start = startsAt ? new Date(startsAt) : null
  const days = start ? (start.getTime() - Date.now()) / 86400_000 : -1
  return useQuery({
    queryKey: ['weather', location, startsAt],
    enabled: !!location && !!start && days > -0.1 && days < 15,
    staleTime: 60 * 60_000,
    retry: false,
    queryFn: async (): Promise<Forecast | null> => {
      const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&language=hu&name=${encodeURIComponent(location!)}`).then((r) => r.json())
      const hit = geo.results?.[0]
      if (!hit) return null
      const day = start!.toISOString().slice(0, 10)
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}&hourly=temperature_2m,precipitation_probability,weather_code&timezone=UTC&start_date=${day}&end_date=${day}`,
      ).then((r) => r.json())
      const hour = start!.getUTCHours()
      const h = res.hourly
      if (!h?.time?.[hour]) return null
      return { temp: Math.round(h.temperature_2m[hour]), rain: h.precipitation_probability[hour] ?? 0, code: h.weather_code[hour], place: hit.name }
    },
  })
}
