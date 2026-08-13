import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { SEED_ACCOUNT_SUMMARIES } from '@/mocks/seed'

export function Admin() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6" data-testid="admin-page">
      <header>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Visible only to the admin role. Standard users are redirected to the
          dashboard.
        </p>
      </header>

      <Card>
        <h2 className="font-medium">Signed-in administrator</h2>
        <p className="mt-1 text-sm" data-testid="admin-current-user">
          {user?.name} ({user?.email})
        </p>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm" data-testid="admin-users-table">
          <caption className="sr-only">Seeded accounts</caption>
          <thead className="border-b border-[var(--color-border)]">
            <tr>
              <th scope="col" className="p-3 text-left font-medium">Name</th>
              <th scope="col" className="p-3 text-left font-medium">Email</th>
              <th scope="col" className="p-3 text-left font-medium">Role</th>
              <th scope="col" className="p-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {SEED_ACCOUNT_SUMMARIES.map((account) => (
              <tr
                key={account.id}
                data-testid={`admin-user-row-${account.id}`}
                className="border-b border-[var(--color-border)] last:border-0"
              >
                <td className="p-3">{account.name}</td>
                <td className="p-3">{account.email}</td>
                <td className="p-3 capitalize">{account.role}</td>
                <td className="p-3">
                  <span
                    data-testid={`admin-user-status-${account.id}`}
                    className={
                      account.locked
                        ? 'text-[var(--color-danger)]'
                        : 'text-[var(--color-success)]'
                    }
                  >
                    {account.locked ? 'Locked' : 'Active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
