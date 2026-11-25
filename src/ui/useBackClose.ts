import { useEffect, useRef } from 'react'

// Android vissza gomb / gesztus zárja a sheetet vagy a teljes képernyős nézetet.
// Nyitáskor egy jelölt history-bejegyzést teszünk fel; vissza-gombra ez pattan le -> bezárás.
// Ha a felületről zárják be, a bejegyzést mi léptetjük vissza.
const MARK = 'bandaOverlay'

export function useBackClose(open: boolean, close: () => void) {
  const closeRef = useRef(close)
  closeRef.current = close

  useEffect(() => {
    if (!open) return
    history.pushState({ ...history.state, [MARK]: true }, '')
    const onPop = () => {
      if (!history.state?.[MARK]) closeRef.current()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      if (history.state?.[MARK]) history.back()
    }
  }, [open])
}

// Bezárás után navigálás: megvárjuk, amíg a jelölt bejegyzés lepattan, különben
// a navigáció a vissza-lépéssel versenyezne.
export function afterOverlayClose(then: () => void) {
  if (!history.state?.[MARK]) return then()
  let done = false
  const run = () => {
    if (done) return
    done = true
    window.removeEventListener('popstate', run)
    then()
  }
  window.addEventListener('popstate', run)
  setTimeout(run, 400)
}
