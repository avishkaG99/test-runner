import { useState } from 'react'
import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import { LogOut, Menu, Moon, Sun, TimerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/products', label: 'Products' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/saved-views', label: 'Saved Views' },
  { to: '/tags', label: 'Tags' },
  { to: '/forms', label: 'Forms' },
  { to: '/ui-playground', label: 'UI Playground' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
  { to: '/admin', label: 'Admin', adminOnly: true },
]

export function AuthenticatedLayout() {
  const navigate = useNavigate()
  const { user, isAdmin, signOut, forceExpire } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [navOpen, setNavOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  const handleSignOut = () => {
    signOut()
    navigate({ to: '/sign-in' })
  }

  const handleForceExpire = () => {
    forceExpire()
    navigate({ to: '/sign-in' })
  }

  return (
    <div className="flex min-h-full flex-col">
      <header
        className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
        data-testid="app-header"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
            data-testid="app-nav-toggle"
            className="md:hidden"
            onClick={() => setNavOpen((open) => !open)}
          >
            <Menu className="size-4" aria-hidden="true" />
          </Button>
          <span className="font-semibold">Test Target App</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="hidden text-sm text-[var(--color-muted)] sm:inline"
            data-testid="app-current-user"
          >
            {user?.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Force session expiry"
            title="Force session expiry"
            data-testid="app-force-expire-button"
            onClick={handleForceExpire}
          >
            <TimerOff className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            data-testid="app-theme-toggle"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="size-4" aria-hidden="true" />
            ) : (
              <Moon className="size-4" aria-hidden="true" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            data-testid="app-sign-out-button"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <nav
          aria-label="Main"
          data-testid="app-sidebar"
          className={cn(
            'border-b border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:block md:w-56 md:border-r md:border-b-0',
            navOpen ? 'block' : 'hidden',
          )}
        >
          <ul className="flex flex-col gap-1">
            {visibleItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  data-testid={`nav-link-${item.to.replace('/', '')}`}
                  onClick={() => setNavOpen(false)}
                  activeProps={{
                    className:
                      'bg-[var(--color-primary)] text-[var(--color-primary-fg)]',
                  }}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-[var(--color-border)]/40"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 p-4 md:p-6" data-testid="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
