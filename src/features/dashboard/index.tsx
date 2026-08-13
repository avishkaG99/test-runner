import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, Skeleton } from '@/components/ui/card'
import { useDashboardStatsQuery } from '@/hooks/api/dashboard'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency } from '@/lib/utils'
import type { ApiError, DashboardStats } from '@/types'

const STAT_CARDS: Array<{
  key: keyof DashboardStats
  label: string
  format?: (value: number) => string
}> = [
  { key: 'totalProducts', label: 'Total products' },
  { key: 'activeProducts', label: 'Active products' },
  { key: 'lowStock', label: 'Low stock' },
  { key: 'totalValue', label: 'Inventory value', format: formatCurrency },
]

export function Dashboard() {
  const { user, isAdmin } = useAuth()
  const { data, isPending, isError, error, refetch, isFetching } =
    useDashboardStatsQuery()

  return (
    <div className="flex flex-col gap-6" data-testid="dashboard-page">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Signed in as{' '}
            <span data-testid="dashboard-user-email">{user?.email}</span> (
            <span data-testid="dashboard-user-role">{user?.role}</span>)
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => refetch()}
          loading={isFetching && !isPending}
          data-testid="dashboard-refresh-button"
        >
          Refresh
        </Button>
      </header>

      {isError && (
        <Alert tone="error" data-testid="dashboard-error">
          {(error as unknown as ApiError).message}
        </Alert>
      )}

      {isPending ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          data-testid="dashboard-stats-loading"
        >
          {STAT_CARDS.map((card) => (
            <Card key={card.key}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-7 w-16" />
            </Card>
          ))}
        </div>
      ) : (
        data && (
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            data-testid="dashboard-stats"
          >
            {STAT_CARDS.map((card) => (
              <Card key={card.key} data-testid={`dashboard-stat-${card.key}`}>
                <p className="text-sm text-[var(--color-muted)]">
                  {card.label}
                </p>
                <p
                  className="mt-1 text-2xl font-semibold"
                  data-testid={`dashboard-stat-${card.key}-value`}
                >
                  {card.format
                    ? card.format(data[card.key])
                    : data[card.key]}
                </p>
              </Card>
            ))}
          </div>
        )
      )}

      {isAdmin && (
        <Card data-testid="dashboard-admin-panel">
          <h2 className="text-lg font-medium">Admin panel</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            This section is visible only to accounts with the admin role.
          </p>
        </Card>
      )}
    </div>
  )
}
