import { useEffect, useRef } from 'react'

// Android vissza gomb / gesztus zárja a sheetet vagy a teljes képernyős nézetet.
// Nyitáskor egy jelölt history-bejegyzést teszünk fel; vissza-gombra ez pattan le -> bezárás.
// Ha a felületről zárják be, a bejegyzést mi léptetjük vissza. Mivel a history.back()
// aszinkron, és a hívás pillanatához képest lép, az új bejegyzést csak utána tesszük fel.
const MARK = 'bandaOverlay'
let pendingBack: Promise<void> | null = null

function stepBack() {
  pendingBack = new Promise((resolve) => {
    const done = () => {
      window.removeEventListener('popstate', done)
      pendingBack = null
      resolve()
    }
    window.addEventListener('popstate', done)
    setTimeout(done, 400)
  })
  history.back()
}

export function useBackClose(open: boolean, close: () => void) {
  const closeRef = useRef(close)
  closeRef.current = close

  useEffect(() => {
    if (!open) return
    let active = true
    let pushed = false
    const onPop = () => {
      if (!history.state?.[MARK]) closeRef.current()
    }
    ;(pendingBack ?? Promise.resolve()).then(() => {
      if (!active) return
      history.pushState({ ...history.state, [MARK]: true }, '')
      pushed = true
      window.addEventListener('popstate', onPop)
    })
    return () => {
      active = false
      window.removeEventListener('popstate', onPop)
      if (pushed && history.state?.[MARK]) stepBack()
    }
  }, [open])
}

// Bezárás után navigálás: megvárjuk, amíg a jelölt bejegyzés lepattan, különben
// a navigáció a vissza-lépéssel versenyezne.
export function afterOverlayClose(then: () => void) {
  if (!history.state?.[MARK] && !pendingBack) return then()
  setTimeout(() => (pendingBack ?? Promise.resolve()).then(then), 0)
}
