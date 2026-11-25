// A böngésző telepítési eseménye korán érkezik; elkapjuk, amíg a React fel nem áll.
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

let deferred: InstallEvent | null = null
const listeners = new Set<() => void>()

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e as InstallEvent
  listeners.forEach((l) => l())
})
window.addEventListener('appinstalled', () => {
  deferred = null
  listeners.forEach((l) => l())
})

export const subscribeInstall = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
export const canInstall = () => deferred !== null

export async function promptInstall() {
  if (!deferred) return
  await deferred.prompt()
  await deferred.userChoice
  deferred = null
  listeners.forEach((l) => l())
}

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
