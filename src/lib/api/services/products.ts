import { apiClient } from '@/lib/api/client'
import type {
  Paginated,
  Product,
  ProductInput,
  ProductListParams,
} from '@/types'

export async function listProducts(
  params: ProductListParams,
): Promise<Paginated<Product>> {
  const { data } = await apiClient.get<Paginated<Product>>('/products', {
    params,
  })
  return data
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/products/${id}`)
  return data
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data } = await apiClient.post<Product>('/products', input)
  return data
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/products/${id}`, input)
  return data
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`)
}

export async function bulkDeleteProducts(ids: string[]) {
  const { data } = await apiClient.post<{ deleted: number }>(
    '/products/bulk-delete',
    { ids },
  )
  return data
}
