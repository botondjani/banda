// Rövid rezgés érintésre (Androidon; iOS-en csendben semmi). Csak állapotváltásoknál használd.
export function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* nem támogatott */
  }
}
