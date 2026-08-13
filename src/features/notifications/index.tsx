import { useState } from 'react'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, Skeleton } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { SelectInput } from '@/components/ui/field'
import {
  useClearNotificationsMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/hooks/api/notifications'
import { cn, formatDate } from '@/lib/utils'
import type { ApiError } from '@/types'

type Filter = 'all' | 'unread' | 'read'

export function Notifications() {
  const [filter, setFilter] = useState<Filter>('all')
  const [clearOpen, setClearOpen] = useState(false)

  const { data, isPending, isError, error } = useNotificationsQuery()
  const markRead = useMarkNotificationReadMutation()
  const markAllRead = useMarkAllNotificationsReadMutation()
  const clearAll = useClearNotificationsMutation()

  const items = data?.items ?? []
  const visible = items.filter((n) =>
    filter === 'all' ? true : filter === 'unread' ? !n.read : n.read,
  )

  const handleClear = () => {
    clearAll.mutate(undefined, {
      onSuccess: () => {
        setClearOpen(false)
        toast.success('All notifications cleared')
      },
      onError: (err) => toast.error((err as unknown as ApiError).message),
    })
  }

  return (
    <div className="flex flex-col gap-6" data-testid="notifications-page">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-[var(--color-muted)]">
            <span data-testid="notifications-unread-count">
              {data?.unreadCount ?? 0}
            </span>{' '}
            unread
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={(data?.unreadCount ?? 0) === 0}
            loading={markAllRead.isPending}
            data-testid="notifications-mark-all-button"
            onClick={() =>
              markAllRead.mutate(undefined, {
                onSuccess: (r) =>
                  toast.success(`Marked ${r.updated} as read`),
              })
            }
          >
            Mark all as read
          </Button>
          <Button
            variant="danger"
            disabled={items.length === 0}
            data-testid="notifications-clear-button"
            onClick={() => setClearOpen(true)}
          >
            Clear all
          </Button>
        </div>
      </header>

      <Card className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-44 flex-col gap-1.5">
          <label htmlFor="notifications-filter" className="text-sm font-medium">
            Show
          </label>
          <SelectInput
            id="notifications-filter"
            data-testid="notifications-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
          >
            <option value="all">All</option>
            <option value="unread">Unread only</option>
            <option value="read">Read only</option>
          </SelectInput>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          Showing <span data-testid="notifications-shown-count">{visible.length}</span> of{' '}
          <span data-testid="notifications-total-count">{items.length}</span>
        </p>
      </Card>

      {isError && (
        <Alert tone="error" data-testid="notifications-error">
          {(error as unknown as ApiError).message}
        </Alert>
      )}

      {isPending ? (
        <Card data-testid="notifications-loading" className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : visible.length === 0 ? (
        <Card data-testid="notifications-empty" className="text-center">
          <p className="font-medium">No notifications to show.</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {items.length === 0
              ? 'Your inbox is empty.'
              : 'Try a different filter.'}
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="notifications-list">
          {visible.map((n) => (
            <li key={n.id}>
              <Card
                data-testid={`notification-${n.id}`}
                className={cn(
                  'flex flex-wrap items-start justify-between gap-3',
                  !n.read && 'border-[var(--color-primary)]',
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-medium"
                      data-testid={`notification-title-${n.id}`}
                    >
                      {n.title}
                    </span>
                    {!n.read && (
                      <span
                        data-testid={`notification-unread-badge-${n.id}`}
                        className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs text-[var(--color-primary-fg)]"
                      >
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {n.body}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {formatDate(n.createdAt)} · {n.kind}
                  </p>
                </div>
                {!n.read && (
                  <Button
                    size="sm"
                    variant="secondary"
                    data-testid={`notification-mark-read-${n.id}`}
                    onClick={() => markRead.mutate(n.id)}
                  >
                    Mark as read
                  </Button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear all notifications"
        description="This removes every notification from your inbox."
        testId="notifications-clear-dialog"
        footer={
          <>
            <Button
              variant="secondary"
              data-testid="notifications-clear-cancel"
              onClick={() => setClearOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={clearAll.isPending}
              data-testid="notifications-clear-confirm"
              onClick={handleClear}
            >
              Clear all
            </Button>
          </>
        }
      >
        <p className="text-sm">This action cannot be undone.</p>
      </Dialog>
    </div>
  )
}
