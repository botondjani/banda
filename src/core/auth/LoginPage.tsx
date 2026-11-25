import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { supabase } from '../../lib/supabase'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { toast } from '../../ui/Toast'
import { useSession } from './auth'

export function LoginPage() {
  const session = useSession()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) toast.error(error.message)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { data, error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) return toast.error(error.message)
    if (mode === 'signup' && !data.session) toast.success('Küldtünk egy megerősítő e-mailt.')
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-5 py-10">
      <div>
        <h1 className="text-5xl font-extrabold tracking-tight">Banda</h1>
        <p className="mt-2 text-muted">Ki ér rá, ki mit hoz, ki tartozik kinek.</p>
      </div>

      <Button onClick={google}>Belépés Google-lel</Button>

      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-px flex-1 bg-line" />
        vagy e-maillel
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label="Jelszó"
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button variant="secondary" type="submit" disabled={busy}>
          {mode === 'signin' ? 'Belépés' : 'Regisztráció'}
        </Button>
      </form>

      <button className="text-sm font-semibold text-muted underline-offset-4 hover:underline" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? 'Még nincs fiókod? Regisztrálj.' : 'Van már fiókod? Lépj be.'}
      </button>
    </main>
  )
}
