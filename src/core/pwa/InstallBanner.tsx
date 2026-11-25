import { Download, Share, X } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { Button } from '../../ui/Button'
import { canInstall, isIos, isStandalone, promptInstall, subscribeInstall } from './install'

const KEY = 'banda.install-dismissed'
const dismissed = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

// Egyszer, elrejthetően: Androidon telepítés gomb, iPhone-on útmutató
export function InstallBanner() {
  const installable = useSyncExternalStore(subscribeInstall, canInstall)
  const [hidden, setHidden] = useState(dismissed)
  const ios = isIos() && !isStandalone()
  if (hidden || isStandalone() || (!installable && !ios)) return null

  const close = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* nem baj */
    }
    setHidden(true)
  }

  return (
    <aside aria-label="App telepítése" className="flex items-start gap-3 rounded-card border border-line bg-surface p-4">
      <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" className="size-10 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="font-semibold">Tedd ki a kezdőképernyőre</p>
        {ios ? (
          <p className="text-sm text-muted">
            Bökj a <Share size={14} strokeWidth={1.75} className="inline align-[-2px]" aria-label="Megosztás" /> gombra, aztán „Főképernyőhöz adás”. Így jönnek az értesítések is.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">Gyorsabban nyílik, és úgy működik, mint egy rendes app.</p>
            <Button className="min-h-10 self-start px-4 text-sm" onClick={() => promptInstall()}>
              <Download size={16} strokeWidth={2} aria-hidden /> Telepítés
            </Button>
          </>
        )}
      </div>
      <button aria-label="Elrejtés" onClick={close} className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center text-muted">
        <X size={20} strokeWidth={1.75} />
      </button>
    </aside>
  )
}
