import { createBrowserRouter, type RouteObject } from 'react-router'
import { LoginPage } from '../core/auth/LoginPage'
import { Layout } from './Layout'
import { FeedPage, ModulesPage, ProfilePage, ProgramsPage } from './pages'

const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <Layout />,
    children: [
      { index: true, element: <FeedPage /> },
      { path: 'programs', element: <ProgramsPage /> },
      { path: 'modules', element: <ModulesPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]

if (import.meta.env.DEV) {
  routes.push({ path: '/dev/ui', lazy: async () => ({ Component: (await import('./DevUi')).DevUi }) })
}

export const router = createBrowserRouter(routes)
