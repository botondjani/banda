import { supabase } from '../lib/supabase'
import { useSession } from '../core/auth/auth'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'

// Fázis 0 helyőrzők – a mag (fázis 1) váltja le őket.

export function FeedPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Feed</h1>
      <EmptyState text="Csend van. Gyanúsan nagy csend." />
    </>
  )
}

export function ProgramsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Programok</h1>
      <EmptyState text="Senki nem szervez semmit. Megint." />
    </>
  )
}

export function ModulesPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Modulok</h1>
      <EmptyState text="A modulok hamarosan beköltöznek." />
    </>
  )
}

export function ProfilePage() {
  const session = useSession()
  return (
    <>
      <h1 className="text-3xl font-bold">Profil</h1>
      <p className="mt-2 text-muted">{session?.user.email}</p>
      <Button variant="secondary" className="mt-6" onClick={() => supabase.auth.signOut()}>
        Kijelentkezés
      </Button>
    </>
  )
}
