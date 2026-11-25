import type { ReactNode } from 'react'
import { Drawer } from 'vaul'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}

export function Sheet({ open, onOpenChange, title, children }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-[20px] bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.18)] outline-none">
          <div className="mx-auto my-3 h-1 w-10 rounded-full bg-line" />
          <Drawer.Title className="mb-4 font-display text-xl font-bold">{title}</Drawer.Title>
          <Drawer.Description className="sr-only">{title}</Drawer.Description>
          <div className="overflow-y-auto">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
