import { useState } from 'react'
import { ProductCategory, ProductStatus } from '@/enums'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import type { Product, ProductInput } from '@/types'

export interface ProductFormValues {
  name: string
  sku: string
  category: string
  price: string
  stock: string
  status: string
}

export function toFormValues(product?: Product): ProductFormValues {
  return {
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    category: product?.category ?? ProductCategory.Electronics,
    price: product ? String(product.price) : '',
    stock: product ? String(product.stock) : '',
    status: product?.status ?? ProductStatus.Draft,
  }
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>

export function validateProduct(
  values: ProductFormValues,
): ProductFormErrors {
  const errors: ProductFormErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Name is required.'
  } else if (values.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters.'
  }

  if (!values.sku.trim()) {
    errors.sku = 'SKU is required.'
  } else if (!/^[A-Z]{4}-\d{4}$/.test(values.sku.trim())) {
    errors.sku = 'SKU must look like ABCD-1234.'
  }

  const price = Number(values.price)
  if (values.price === '') {
    errors.price = 'Price is required.'
  } else if (!Number.isFinite(price) || price <= 0) {
    errors.price = 'Price must be greater than 0.'
  }

  const stock = Number(values.stock)
  if (values.stock === '') {
    errors.stock = 'Stock is required.'
  } else if (!Number.isInteger(stock) || stock < 0) {
    errors.stock = 'Stock must be a whole number of 0 or more.'
  }

  return errors
}

export function toProductInput(values: ProductFormValues): ProductInput {
  return {
    name: values.name.trim(),
    sku: values.sku.trim(),
    category: values.category as ProductInput['category'],
    price: Number(values.price),
    stock: Number(values.stock),
    status: values.status as ProductInput['status'],
  }
}

interface ProductFormProps {
  idPrefix: string
  values: ProductFormValues
  errors: ProductFormErrors
  onChange: (values: ProductFormValues) => void
}

export function ProductForm({
  idPrefix,
  values,
  errors,
  onChange,
}: ProductFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const set = (key: keyof ProductFormValues) => (value: string) => {
    onChange({ ...values, [key]: value })
  }

  const errorFor = (key: keyof ProductFormValues) =>
    touched[key] || errors[key] ? errors[key] : undefined

  const blur = (key: keyof ProductFormValues) =>
    setTouched((prev) => ({ ...prev, [key]: true }))

  return (
    <div className="flex flex-col gap-4">
      <Field
        id={`${idPrefix}-name`}
        label="Name"
        required
        error={errorFor('name')}
      >
        <TextInput
          id={`${idPrefix}-name`}
          data-testid={`${idPrefix}-name-input`}
          value={values.name}
          invalid={Boolean(errorFor('name'))}
          onChange={(e) => set('name')(e.target.value)}
          onBlur={() => blur('name')}
        />
      </Field>

      <Field
        id={`${idPrefix}-sku`}
        label="SKU"
        required
        hint="Format: ABCD-1234"
        error={errorFor('sku')}
      >
        <TextInput
          id={`${idPrefix}-sku`}
          hasHint
          data-testid={`${idPrefix}-sku-input`}
          value={values.sku}
          invalid={Boolean(errorFor('sku'))}
          onChange={(e) => set('sku')(e.target.value.toUpperCase())}
          onBlur={() => blur('sku')}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${idPrefix}-price`}
          label="Price"
          required
          error={errorFor('price')}
        >
          <TextInput
            id={`${idPrefix}-price`}
            type="number"
            step="0.01"
            min={0}
            data-testid={`${idPrefix}-price-input`}
            value={values.price}
            invalid={Boolean(errorFor('price'))}
            onChange={(e) => set('price')(e.target.value)}
            onBlur={() => blur('price')}
          />
        </Field>

        <Field
          id={`${idPrefix}-stock`}
          label="Stock"
          required
          error={errorFor('stock')}
        >
          <TextInput
            id={`${idPrefix}-stock`}
            type="number"
            min={0}
            data-testid={`${idPrefix}-stock-input`}
            value={values.stock}
            invalid={Boolean(errorFor('stock'))}
            onChange={(e) => set('stock')(e.target.value)}
            onBlur={() => blur('stock')}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${idPrefix}-category`} label="Category" required>
          <SelectInput
            id={`${idPrefix}-category`}
            data-testid={`${idPrefix}-category-select`}
            value={values.category}
            onChange={(e) => set('category')(e.target.value)}
          >
            {Object.values(ProductCategory).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field id={`${idPrefix}-status`} label="Status" required>
          <SelectInput
            id={`${idPrefix}-status`}
            data-testid={`${idPrefix}-status-select`}
            value={values.status}
            onChange={(e) => set('status')(e.target.value)}
          >
            {Object.values(ProductStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
    </div>
  )
}
