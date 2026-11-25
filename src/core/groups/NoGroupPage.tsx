import { NewGroupForm } from './NewGroupForm'

export function NoGroupPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-5 py-10">
      <div>
        <h1 className="text-4xl font-extrabold">Még nincs bandád.</h1>
        <p className="mt-2 text-muted">Alapíts egyet, vagy kérj meghívó linket a többiektől.</p>
      </div>
      <NewGroupForm />
    </main>
  )
}
