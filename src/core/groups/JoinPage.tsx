import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useSession } from '../auth/auth'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { setPendingJoin } from './active'
import { joinGroup } from './api'

export function JoinPage() {
  const { code = '' } = useParams()
  const session = useSession()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [failed, setFailed] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (!session || started.current) return
    started.current = true
    setPendingJoin(null)
    joinGroup(code)
      .then(() => qc.invalidateQueries({ queryKey: ['groups'] }))
      .then(() => navigate('/', { replace: true }))
      .catch(() => setFailed(true))
  }, [session, code, navigate, qc])

  if (session === null) {
    setPendingJoin(code)
    return <Navigate to="/login" replace />
  }

  return (
    <main className="mx-auto max-w-md px-5">
      {failed ? (
        <EmptyState text="Ez a meghívó nem él. Kérj újat." action={<Button onClick={() => navigate('/')}>Tovább</Button>} />
      ) : (
        <EmptyState text="Csatlakozás…" />
      )}
    </main>
  )
}
