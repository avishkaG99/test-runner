import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, Skeleton } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { SelectInput, TextInput } from '@/components/ui/field'
import { ProductCategory } from '@/enums'
import {
  useBulkDeleteProductsMutation,
  useCreateProductMutation,
  useDeleteProductMutation,
  useProductsQuery,
  useUpdateProductMutation,
} from '@/hooks/api/products'
import { formatCurrency } from '@/lib/utils'
import type { ApiError, Product } from '@/types'
import {
  ProductForm,
  toFormValues,
  toProductInput,
  validateProduct,
  type ProductFormErrors,
  type ProductFormValues,
} from './product-form'

const PAGE_SIZE = 10

const COLUMNS: Array<{ key: keyof Product; label: string; numeric?: boolean }> =
  [
    { key: 'name', label: 'Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price', numeric: true },
    { key: 'stock', label: 'Stock', numeric: true },
    { key: 'status', label: 'Status' },
  ]

export function Products() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<keyof Product>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const [formValues, setFormValues] = useState<ProductFormValues>(
    toFormValues(),
  )
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  // Debounce keeps the query key stable while the user is still typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: category as ProductCategory | 'all',
      sortBy,
      sortDir,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedSearch, category, sortBy, sortDir, page],
  )

  const { data, isPending, isError, error, isFetching } =
    useProductsQuery(params)

  const createMutation = useCreateProductMutation()
  const updateMutation = useUpdateProductMutation(editing?.id ?? '')
  const deleteMutation = useDeleteProductMutation()
  const bulkDeleteMutation = useBulkDeleteProductsMutation()

  const items = data?.items ?? []
  const allOnPageSelected =
    items.length > 0 && items.every((p) => selected.includes(p.id))

  const toggleSort = (key: keyof Product) => {
    if (sortBy === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const openCreate = () => {
    setFormValues(toFormValues())
    setFormErrors({})
    setFormError(null)
    setCreateOpen(true)
  }

  const openEdit = (product: Product) => {
    setFormValues(toFormValues(product))
    setFormErrors({})
    setFormError(null)
    setEditing(product)
  }

  const handleCreate = () => {
    const errors = validateProduct(formValues)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setFormError(null)
    createMutation.mutate(toProductInput(formValues), {
      onSuccess: (product) => {
        setCreateOpen(false)
        toast.success(`Created “${product.name}”`)
      },
      onError: (err) => {
        const apiError = err as unknown as ApiError
        setFormError(apiError.message)
        if (apiError.fieldErrors) setFormErrors(apiError.fieldErrors)
      },
    })
  }

  const handleUpdate = () => {
    const errors = validateProduct(formValues)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setFormError(null)
    updateMutation.mutate(toProductInput(formValues), {
      onSuccess: (product) => {
        setEditing(null)
        toast.success(`Updated “${product.name}”`)
      },
      onError: (err) => {
        const apiError = err as unknown as ApiError
        setFormError(apiError.message)
        if (apiError.fieldErrors) setFormErrors(apiError.fieldErrors)
      },
    })
  }

  const handleDelete = () => {
    if (!deleting) return
    deleteMutation.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`Deleted “${deleting.name}”`)
        setSelected((prev) => prev.filter((id) => id !== deleting.id))
        setDeleting(null)
      },
      onError: (err) => toast.error((err as unknown as ApiError).message),
    })
  }

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selected, {
      onSuccess: (result) => {
        toast.success(`Deleted ${result.deleted} products`)
        setSelected([])
        setBulkDeleteOpen(false)
        setPage(1)
      },
      onError: (err) => toast.error((err as unknown as ApiError).message),
    })
  }

  return (
    <div className="flex flex-col gap-6" data-testid="products-page">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-[var(--color-muted)]">
            A product named with “fail” triggers a server error.
          </p>
        </div>
        <Button onClick={openCreate} data-testid="products-create-button">
          <Plus className="size-4" aria-hidden="true" />
          New product
        </Button>
      </header>

      <Card className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <label htmlFor="products-search" className="text-sm font-medium">
            Search
          </label>
          <TextInput
            id="products-search"
            type="search"
            placeholder="Name or SKU…"
            data-testid="products-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex min-w-44 flex-col gap-1.5">
          <label htmlFor="products-category" className="text-sm font-medium">
            Category
          </label>
          <SelectInput
            id="products-category"
            data-testid="products-category-filter"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All categories</option>
            {Object.values(ProductCategory).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SelectInput>
        </div>

        {selected.length > 0 && (
          <Button
            variant="danger"
            data-testid="products-bulk-delete-button"
            onClick={() => setBulkDeleteOpen(true)}
          >
            Delete {selected.length} selected
          </Button>
        )}
      </Card>

      {isError && (
        <Alert tone="error" data-testid="products-error">
          {(error as unknown as ApiError).message}
        </Alert>
      )}

      {isPending ? (
        <Card data-testid="products-loading" className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </Card>
      ) : items.length === 0 ? (
        <Card data-testid="products-empty" className="text-center">
          <p className="font-medium">No products match your filters.</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Try clearing the search box or choosing a different category.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm" data-testid="products-table">
            <caption className="sr-only">Products</caption>
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
              <tr>
                <th scope="col" className="w-10 p-3">
                  <input
                    type="checkbox"
                    aria-label="Select all products on this page"
                    data-testid="products-select-all-checkbox"
                    checked={allOnPageSelected}
                    onChange={(e) => {
                      const pageIds = items.map((p) => p.id)
                      setSelected((prev) =>
                        e.target.checked
                          ? [...new Set([...prev, ...pageIds])]
                          : prev.filter((id) => !pageIds.includes(id)),
                      )
                    }}
                    className="size-4"
                  />
                </th>
                {COLUMNS.map((column) => {
                  const active = sortBy === column.key
                  const Icon = !active
                    ? ArrowUpDown
                    : sortDir === 'asc'
                      ? ArrowUp
                      : ArrowDown
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={
                        active
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className={column.numeric ? 'text-right' : 'text-left'}
                    >
                      <button
                        type="button"
                        data-testid={`products-sort-${column.key}`}
                        onClick={() => toggleSort(column.key)}
                        className={`inline-flex w-full items-center gap-1 p-3 font-medium hover:text-[var(--color-primary)] ${
                          column.numeric ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {column.label}
                        <Icon className="size-3" aria-hidden="true" />
                      </button>
                    </th>
                  )
                })}
                <th scope="col" className="p-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => (
                <tr
                  key={product.id}
                  data-testid={`products-row-${product.id}`}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${product.name}`}
                      data-testid={`products-select-${product.id}`}
                      checked={selected.includes(product.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, product.id]
                            : prev.filter((id) => id !== product.id),
                        )
                      }
                      className="size-4"
                    />
                  </td>
                  <td className="p-3" data-testid={`products-name-${product.id}`}>
                    {product.name}
                  </td>
                  <td className="p-3">{product.sku}</td>
                  <td className="p-3 capitalize">{product.category}</td>
                  <td className="p-3 text-right">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="p-3 text-right">{product.stock}</td>
                  <td className="p-3 capitalize">{product.status}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        data-testid={`products-edit-${product.id}`}
                        onClick={() => openEdit(product)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        data-testid={`products-delete-${product.id}`}
                        onClick={() => setDeleting(product)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {data && data.total > 0 && (
        <nav
          aria-label="Pagination"
          className="flex flex-wrap items-center justify-between gap-3"
          data-testid="products-pagination"
        >
          <p className="text-sm text-[var(--color-muted)]">
            Showing{' '}
            <span data-testid="products-shown-count">{items.length}</span> of{' '}
            <span data-testid="products-total-count">{data.total}</span>{' '}
            products
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1 || isFetching}
              data-testid="products-prev-page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm" data-testid="products-page-indicator">
              Page {data.page} of {data.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= data.totalPages || isFetching}
              data-testid="products-next-page"
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </nav>
      )}

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New product"
        description="Create a product in the mock catalogue."
        testId="products-create-dialog"
        footer={
          <>
            <Button
              variant="secondary"
              data-testid="products-create-cancel"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              loading={createMutation.isPending}
              data-testid="products-create-submit"
              onClick={handleCreate}
            >
              Create product
            </Button>
          </>
        }
      >
        {formError && (
          <Alert
            tone="error"
            className="mb-4"
            data-testid="products-create-error"
          >
            {formError}
          </Alert>
        )}
        <ProductForm
          idPrefix="products-create"
          values={formValues}
          errors={formErrors}
          onChange={setFormValues}
        />
      </Dialog>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.name ?? ''}`}
        testId="products-edit-dialog"
        footer={
          <>
            <Button
              variant="secondary"
              data-testid="products-edit-cancel"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
            <Button
              loading={updateMutation.isPending}
              data-testid="products-edit-submit"
              onClick={handleUpdate}
            >
              Save changes
            </Button>
          </>
        }
      >
        {formError && (
          <Alert
            tone="error"
            className="mb-4"
            data-testid="products-edit-error"
          >
            {formError}
          </Alert>
        )}
        <ProductForm
          idPrefix="products-edit"
          values={formValues}
          errors={formErrors}
          onChange={setFormValues}
        />
      </Dialog>

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete product"
        description={`This permanently removes “${deleting?.name}” from the catalogue.`}
        testId="products-delete-dialog"
        footer={
          <>
            <Button
              variant="secondary"
              data-testid="products-delete-cancel"
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              data-testid="products-delete-confirm"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm">This action cannot be undone.</p>
      </Dialog>

      <Dialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title={`Delete ${selected.length} products`}
        testId="products-bulk-delete-dialog"
        footer={
          <>
            <Button
              variant="secondary"
              data-testid="products-bulk-delete-cancel"
              onClick={() => setBulkDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={bulkDeleteMutation.isPending}
              data-testid="products-bulk-delete-confirm"
              onClick={handleBulkDelete}
            >
              Delete all
            </Button>
          </>
        }
      >
        <p className="text-sm">
          This permanently removes {selected.length} products.
        </p>
      </Dialog>
    </div>
  )
}
