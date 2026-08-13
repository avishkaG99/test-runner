import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { AuthProvider } from '@/contexts/auth-context'
import { useAuth } from '@/hooks/use-auth'
import { queryClient, router } from '@/lib/router'

/**
 * Feeds the live auth context into the router so `beforeLoad` guards re-evaluate
 * whenever the session changes.
 */
function RouterWithAuth() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth, queryClient }} />
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterWithAuth />
      </AuthProvider>
    </QueryClientProvider>
  )
}
