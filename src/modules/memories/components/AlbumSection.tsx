import { useRef, useState } from 'react'
import { useSession } from '../../../core/auth/auth'
import { useGroup } from '../../../core/groups/GroupProvider'
import { useProgram } from '../../../core/programs/api'
import { Button } from '../../../ui/Button'
import { toast } from '../../../ui/Toast'
import { usePhotos, useUploadPhotos } from '../api'
import { PhotoViewer } from './PhotoViewer'

export function AlbumSection({ programId }: { programId: string }) {
  const { group } = useGroup()
  const uid = useSession()!.user.id
  const { data: program } = useProgram(programId)
  const { data: photos = [] } = usePhotos(programId)
  const upload = useUploadPhotos({ id: programId, title: program?.title ?? '' }, group.id, uid)
  const input = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState<number | null>(null)

  function onFiles(list: FileList | null) {
    const files = [...(list ?? [])].slice(0, 20)
    if (!files.length) return
    upload.mutate(files, {
      onSuccess: (n) => toast.success(`${n} fotó fent.`),
      onError: () => toast.error('Valamelyik kép nem ment fel.'),
    })
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Album</h2>
        {photos.length > 0 && <span className="font-display font-semibold text-muted tabular-nums">{photos.length} fotó</span>}
      </div>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((p, i) => (
            <button key={p.id} onClick={() => setOpen(i)} className="aspect-square overflow-hidden rounded-lg bg-line">
              <img src={p.url} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <Button variant="secondary" disabled={upload.isPending} onClick={() => input.current?.click()}>
        {upload.isPending ? 'Feltöltés…' : 'Fotók hozzáadása'}
      </Button>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      {open !== null && <PhotoViewer photos={photos} index={open} programId={programId} onIndex={setOpen} />}
    </section>
  )
}
