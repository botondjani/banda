import { WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine)
  if (online) return null
  return (
    <div role="status" className="fixed inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-40 flex justify-center px-5">
      <span className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
        <WifiOff size={16} strokeWidth={1.75} aria-hidden /> Nincs net. Amit látsz, lehet, hogy régi.
      </span>
    </div>
  )
}
