import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { RouterProvider } from 'react-router'
import { AuthProvider } from '../core/auth/auth'
import { ModulesProvider } from '../core/modules'
import { toast, Toaster } from '../ui/Toast'
import { modules } from './modules'
import { router } from './router'

// Ha valami elsőre nem töltődik be, egy (nem ismétlődő) üzenet; a háttérfrissítés hibája csendes
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (_error, query) => {
      if (query.state.data === undefined) toast.error('Nem sikerült betölteni. Rossz a net?', { id: 'load-error' })
    },
  }),
  defaultOptions: { queries: { staleTime: 20_000, retry: 2 } },
})

export function App() {
  return (
    <MotionConfig reducedMotion="user">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModulesProvider modules={modules}>
          <RouterProvider router={router} />
        </ModulesProvider>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
    </MotionConfig>
  )
}
