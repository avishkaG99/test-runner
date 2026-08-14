import type {
  Language,
  NotificationKind,
  ProductCategory,
  ProductStatus,
  TagColor,
  UserRole,
} from '@/enums'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

/**
 * Editable profile detail for the signed-in user. Kept separate from `User`:
 * `User` is the session identity echoed by login, this is the fuller record the
 * profile screen loads and writes.
 */
export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  displayName: string
  jobTitle: string
  bio: string
  timezone: string
  language: Language
  marketingEmails: boolean
  updatedAt: string
}

export type UserProfileInput = Pick<
  UserProfile,
  | 'displayName'
  | 'jobTitle'
  | 'bio'
  | 'timezone'
  | 'language'
  | 'marketingEmails'
>

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
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

export interface AppNotification {
  id: string
  title: string
  body: string
  kind: NotificationKind
  read: boolean
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  color: TagColor
  productCount: number
  createdAt: string
}

export interface SavedView {
  id: string
  name: string
  category: ProductCategory | 'all'
  status: ProductStatus | 'all'
  createdAt: string
}
