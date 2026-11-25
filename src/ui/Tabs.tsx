import * as RadixTabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'

type Props = {
  tabs: { value: string; label: string; content: ReactNode }[]
  defaultValue?: string
}

export function Tabs({ tabs, defaultValue = tabs[0]?.value }: Props) {
  return (
    <RadixTabs.Root defaultValue={defaultValue}>
      <RadixTabs.List className="flex gap-1 rounded-full border border-line bg-surface p-1">
        {tabs.map((t) => (
          <RadixTabs.Trigger
            key={t.value}
            value={t.value}
            className="min-h-9 flex-1 rounded-full text-sm font-semibold text-muted transition-colors duration-150 data-[state=active]:bg-ink data-[state=active]:text-paper"
          >
            {t.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map((t) => (
        <RadixTabs.Content key={t.value} value={t.value} className="pt-4">
          {t.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}
