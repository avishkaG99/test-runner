import type { ProductCategory, ProductStatus, UserRole } from '@/enums'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface AuthSession {
  token: string
  user: User
  expiresAt: number
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  token: string
  user: User
  expiresAt: number
}

export interface SignUpRequest {
  name: string
  email: string
  password: string
}

export interface Product {
  id: string
  name: string
  sku: string
  category: ProductCategory
  price: number
  stock: number
  status: ProductStatus
  createdAt: string
}

export type ProductInput = Omit<Product, 'id' | 'createdAt'>

export interface ProductListParams {
  search?: string
  category?: ProductCategory | 'all'
  sortBy?: keyof Product
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DashboardStats {
  totalProducts: number
  activeProducts: number
  lowStock: number
  totalValue: number
}

export interface ApiError {
  message: string
  code?: string
  fieldErrors?: Record<string, string>
}
