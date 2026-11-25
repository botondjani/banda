import { Toaster as Sonner } from 'sonner'

export { toast } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-ink shadow-[0_8px_24px_rgba(0,0,0,0.14)]',
          title: 'font-semibold',
          description: 'text-sm text-muted',
          success: '[&_[data-icon]]:text-positive',
          error: '[&_[data-icon]]:text-negative',
        },
      }}
    />
  )
}
