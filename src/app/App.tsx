import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { AuthProvider } from '../core/auth/auth'
import { ModulesProvider } from '../core/modules'
import { Toaster } from '../ui/Toast'
import { modules } from './modules'
import { router } from './router'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModulesProvider modules={modules}>
          <RouterProvider router={router} />
        </ModulesProvider>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}
