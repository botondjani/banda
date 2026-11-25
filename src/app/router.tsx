import { createBrowserRouter, type RouteObject } from 'react-router'
import { LoginPage } from '../core/auth/LoginPage'
import { FeedPage } from '../core/feed/FeedPage'
import { GroupPage } from '../core/groups/GroupPage'
import { JoinPage } from '../core/groups/JoinPage'
import { NotificationsPage } from '../core/notifications/NotificationsPage'
import { ProfilePage } from '../core/profiles/ProfilePage'
import { ProgramPage } from '../core/programs/ProgramPage'
import { ProgramsPage } from '../core/programs/ProgramsPage'
import { Layout } from './Layout'
import { ModulesPage } from './ModulesPage'

const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/join/:code', element: <JoinPage /> },
  {
    element: <Layout />,
    children: [
      { index: true, element: <FeedPage /> },
      { path: 'programs', element: <ProgramsPage /> },
      { path: 'programs/:id', element: <ProgramPage /> },
      { path: 'modules', element: <ModulesPage /> },
      { path: 'group', element: <GroupPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'notifications', element: <NotificationsPage /> },
    ],
  },
]

if (import.meta.env.DEV) {
  routes.push({ path: '/dev/ui', lazy: async () => ({ Component: (await import('./DevUi')).DevUi }) })
}

export const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL })
