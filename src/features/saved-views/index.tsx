import { useState } from 'react'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, Skeleton } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { ProductCategory, ProductStatus } from '@/enums'
import {
  useCreateSavedViewMutation,
  useDeleteSavedViewMutation,
  useSavedViewsQuery,
} from '@/hooks/api/saved-views'
import { formatDate } from '@/lib/utils'
import type { ApiError, SavedView } from '@/types'

const CATEGORIES = Object.values(ProductCategory)
const STATUSES = Object.values(ProductStatus)

export function SavedViews() {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<SavedView['category']>('all')
  const [status, setStatus] = useState<SavedView['status']>('all')
  const [nameError, setNameError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<SavedView | null>(null)

  const { data, isPending, isError, error } = useSavedViewsQuery()
  const create = useCreateSavedViewMutation()
  const remove = useDeleteSavedViewMutation()

  const items = data?.items ?? []

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Name is required.')
      return
    }
    setNameError(null)

    create.mutate(
      { name: trimmed, category, status },
      {
        onSuccess: (r) => {
          setName('')
          setCategory('all')
          setStatus('all')
          toast.success(`Saved view "${r.item.name}" created`)
        },
        onError: (err) => {
          const message = (err as unknown as ApiError).message
          setNameError(message)
          toast.error(message)
        },
      },
    )
  }

  const handleDelete = () => {
    if (!pendingDelete) return
    const target = pendingDelete
    remove.mutate(target.id, {
      onSuccess: () => {
        setPendingDelete(null)
        toast.success(`Saved view "${target.name}" deleted`)
      },
      onError: (err) => toast.error((err as unknown as ApiError).message),
    })
  }

  return (
    <div className="flex flex-col gap-6" data-testid="saved-views-page">
      <header>
        <h1 className="text-2xl font-semibold">Saved Views</h1>
        <p className="text-sm text-[var(--color-muted)]">
          <span data-testid="saved-views-count">{items.length}</span> saved
        </p>
      </header>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Create a view</h2>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-56 flex-1">
            <Field
              id="saved-view-name"
              label="Name"
              required
              error={nameError ?? undefined}
            >
              <TextInput
                id="saved-view-name"
                data-testid="saved-view-name-input"
                value={name}
                invalid={Boolean(nameError)}
                placeholder="e.g. Active electronics"
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError(null)
                }}
              />
            </Field>
          </div>

          <div className="min-w-44">
            <Field id="saved-view-category" label="Category">
              <SelectInput
                id="saved-view-category"
                data-testid="saved-view-category-select"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as SavedView['category'])
                }
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <div className="min-w-44">
            <Field id="saved-view-status" label="Status">
              <SelectInput
                id="saved-view-status"
                data-testid="saved-view-status-select"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as SavedView['status'])
                }
              >
                <option value="all">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <Button
            className="mt-6"
            loading={create.isPending}
            data-testid="saved-view-create-button"
            onClick={handleCreate}
          >
            Save view
          </Button>
        </div>
      </Card>

      {isError && (
        <Alert tone="error" data-testid="saved-views-error">
          {(error as unknown as ApiError).message}
        </Alert>
      )}

      {isPending ? (
        <Card data-testid="saved-views-loading" className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : items.length === 0 ? (
        <Card data-testid="saved-views-empty" className="text-center">
          <p className="font-medium">No saved views yet.</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Create one above to get started.
          </p>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3" data-testid="saved-views-list">
          {items.map((view) => (
            <div
              key={view.id}
              data-testid={`saved-view-row-${view.id}`}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium" data-testid={`saved-view-name-${view.id}`}>
                  {view.name}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  <span data-testid={`saved-view-filters-${view.id}`}>
                    {view.category === 'all' ? 'All categories' : view.category}
                    {' · '}
                    {view.status === 'all' ? 'All statuses' : view.status}
                  </span>
                  {' · '}
                  {formatDate(view.createdAt)}
                </p>
              </div>
              <Button
                variant="danger"
                data-testid={`saved-view-delete-${view.id}`}
                onClick={() => setPendingDelete(view)}
              >
                Delete
              </Button>
            </div>
          ))}
        </Card>
      )}

      <Dialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete saved view"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be removed permanently.`
            : ''
        }
        testId="saved-view-delete-dialog"
        footer={
          <>
            <Button
              variant="secondary"
              data-testid="saved-view-delete-cancel"
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              data-testid="saved-view-delete-confirm"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-muted)]">
          This action cannot be undone.
        </p>
      </Dialog>
    </div>
  )
}
