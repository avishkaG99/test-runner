import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { UserRole } from '@/enums'
import { getSession } from '@/lib/auth'
import { routeTree } from '@/routeTree.gen'
import type { AuthContextValue } from '@/contexts/auth-context'

/**
 * Router matching starts before RouterProvider injects the live auth context,
 * so guards on a cold page load would otherwise read `undefined`. Seeding from
 * storage makes the very first `beforeLoad` see the true session.
 */
function initialAuthContext(): AuthContextValue {
  const session = getSession()
  const noop = () => {}
  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: session !== null,
    isAdmin: session?.user.role === UserRole.Admin,
    signIn: noop,
    signOut: noop,
    forceExpire: noop,
    updateUser: noop,
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retries would mask the deliberate error states this app exposes.
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

export const router = createRouter({
  routeTree,
  context: {
    // Superseded by the live context from RouterProvider once React mounts.
    auth: initialAuthContext(),
    queryClient,
  },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
