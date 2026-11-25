import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react'
import { useSession } from '../../../core/auth/auth'
import { useDeletePhoto, type Photo } from '../api'

type Props = { photos: Photo[]; index: number; programId: string; onIndex: (i: number | null) => void }

// Teljes képernyős nézet; lapozás gombbal vagy a kép két felére bökve
export function PhotoViewer({ photos, index, programId, onIndex }: Props) {
  const uid = useSession()!.user.id
  const remove = useDeletePhoto(programId)
  const photo = photos[index]
  if (!photo) return null
  const go = (d: number) => onIndex((index + d + photos.length) % photos.length)
  const btn = 'flex size-11 items-center justify-center rounded-full text-white'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" role="dialog" aria-label="Fotó">
      <div className="flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button aria-label="Bezárás" className={btn} onClick={() => onIndex(null)}>
          <X size={24} strokeWidth={1.75} />
        </button>
        <span className="text-sm text-white/70 tabular-nums">
          {index + 1} / {photos.length}
        </span>
        {photo.uploaded_by === uid ? (
          <button aria-label="Törlés" className={btn} onClick={() => remove.mutate(photo, { onSuccess: () => onIndex(photos.length > 1 ? Math.max(0, index - 1) : null) })}>
            <Trash2 size={20} strokeWidth={1.75} />
          </button>
        ) : (
          <span className="size-11" />
        )}
      </div>
      <div className="relative flex flex-1 items-center justify-center">
        <img src={photo.url} alt="" className="max-h-full max-w-full object-contain" />
        {photos.length > 1 && (
          <>
            <button aria-label="Előző" className={`${btn} absolute left-2`} onClick={() => go(-1)}>
              <ChevronLeft size={28} strokeWidth={1.75} />
            </button>
            <button aria-label="Következő" className={`${btn} absolute right-2`} onClick={() => go(1)}>
              <ChevronRight size={28} strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
