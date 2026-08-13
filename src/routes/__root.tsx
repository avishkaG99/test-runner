import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import type { QueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import type { AuthContextValue } from '@/contexts/auth-context'

export interface RouterContext {
  auth: AuthContextValue
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: ErrorBoundary,
})

function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div
      className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center"
      data-testid="error-boundary"
    >
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p
        className="max-w-md text-sm text-[var(--color-muted)]"
        data-testid="error-boundary-message"
      >
        {error.message}
      </p>
      <Button
        data-testid="error-boundary-reload"
        onClick={() => window.location.assign('/dashboard')}
      >
        Back to dashboard
      </Button>
    </div>
  )
}

function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </>
  )
}

function NotFound() {
  return (
    <div
      className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center"
      data-testid="not-found-page"
    >
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-[var(--color-muted)]">
        We couldn’t find the page you were looking for.
      </p>
      <a href="/dashboard" data-testid="not-found-home-link">
        <Button>Back to dashboard</Button>
      </a>
    </div>
  )
}
