import { useNavigate, type To } from 'react-router'

// Valódi "vissza", ha az appon belül jöttünk ide; különben (mélylink) a megadott helyre
export function useGoBack(fallback: To) {
  const navigate = useNavigate()
  return () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }
}
