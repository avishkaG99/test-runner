import { useState } from 'react'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, Skeleton } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { TagColor } from '@/enums'
import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useTagsQuery,
} from '@/hooks/api/tags'
import { cn, formatDate } from '@/lib/utils'
import type { ApiError, Tag } from '@/types'

const COLORS = Object.values(TagColor)

const SWATCH: Record<string, string> = {
  slate: 'bg-slate-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
}

export function Tags() {
  const [name, setName] = useState('')
  const [color, setColor] = useState<Tag['color']>(TagColor.Slate)
  const [nameError, setNameError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data, isPending, isError, error } = useTagsQuery()
  const create = useCreateTagMutation()
  const remove = useDeleteTagMutation()

  const items = data?.items ?? []
  const unusedCount = items.filter((t) => t.productCount === 0).length

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Tag name is required.')
      return
    }
    setNameError(null)

    create.mutate(
      { name: trimmed, color },
      {
        onSuccess: (r) => {
          setName('')
          setColor(TagColor.Slate)
          toast.success(`Tag "${r.item.name}" created`)
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
    setDeleteError(null)
    remove.mutate(target.id, {
      onSuccess: () => {
        setPendingDelete(null)
        toast.success(`Tag "${target.name}" deleted`)
      },
      onError: (err) => {
        const message = (err as unknown as ApiError).message
        setDeleteError(message)
        toast.error(message)
      },
    })
  }

  return (
    <div className="flex flex-col gap-6" data-testid="tags-page">
      <header>
        <h1 className="text-2xl font-semibold">Tags</h1>
        <p className="text-sm text-[var(--color-muted)]">
          <span data-testid="tags-count">{items.length}</span> tags ·{' '}
          <span data-testid="tags-unused-count">{unusedCount}</span> unused
        </p>
      </header>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Create a tag</h2>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-56 flex-1">
            <Field
              id="tag-name"
              label="Name"
              required
              error={nameError ?? undefined}
            >
              <TextInput
                id="tag-name"
                data-testid="tag-name-input"
                value={name}
                invalid={Boolean(nameError)}
                placeholder="e.g. Featured"
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError(null)
                }}
              />
            </Field>
          </div>

          <div className="min-w-44">
            <Field id="tag-color" label="Colour">
              <SelectInput
                id="tag-color"
                data-testid="tag-color-select"
                value={color}
                onChange={(e) => setColor(e.target.value as Tag['color'])}
              >
                {COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <Button
            className="mt-6"
            loading={create.isPending}
            data-testid="tag-create-button"
            onClick={handleCreate}
          >
            Create tag
          </Button>
        </div>
      </Card>

      {isError && (
        <Alert tone="error" data-testid="tags-error">
          {(error as unknown as ApiError).message}
        </Alert>
      )}

      {isPending ? (
        <Card data-testid="tags-loading" className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : items.length === 0 ? (
        <Card data-testid="tags-empty" className="text-center">
          <p className="font-medium">No tags yet.</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Create one above to get started.
          </p>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3" data-testid="tags-list">
          {items.map((tag) => (
            <div
              key={tag.id}
              data-testid={`tag-row-${tag.id}`}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={cn('size-3 rounded-full', SWATCH[tag.color])}
                />
                <div>
                  <p className="font-medium" data-testid={`tag-name-${tag.id}`}>
                    {tag.name}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    <span data-testid={`tag-usage-${tag.id}`}>
                      {tag.productCount === 0
                        ? 'Not applied to any product'
                        : `Applied to ${tag.productCount} product${tag.productCount === 1 ? '' : 's'}`}
                    </span>
                    {' · '}
                    {formatDate(tag.createdAt)}
                  </p>
                </div>
              </div>
              <Button
                variant="danger"
                data-testid={`tag-delete-${tag.id}`}
                onClick={() => {
                  setDeleteError(null)
                  setPendingDelete(tag)
                }}
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
        title="Delete tag"
        description={
          pendingDelete ? `"${pendingDelete.name}" will be removed.` : ''
        }
        testId="tag-delete-dialog"
        footer={
          <>
            <Button
              variant="secondary"
              data-testid="tag-delete-cancel"
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              data-testid="tag-delete-confirm"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        {deleteError ? (
          <Alert tone="error" data-testid="tag-delete-error">
            {deleteError}
          </Alert>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">
            Tags applied to a product cannot be deleted.
          </p>
        )}
      </Dialog>
    </div>
  )
}
