export const UserRole = {
  Admin: 'admin',
  User: 'user',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const ProductCategory = {
  Electronics: 'electronics',
  Apparel: 'apparel',
  Home: 'home',
  Sports: 'sports',
  Books: 'books',
} as const

export type ProductCategory =
  (typeof ProductCategory)[keyof typeof ProductCategory]

export const ProductStatus = {
  Active: 'active',
  Draft: 'draft',
  Archived: 'archived',
} as const

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus]

export const NotificationKind = {
  Info: 'info',
  Warning: 'warning',
  Success: 'success',
} as const

export type NotificationKind =
  (typeof NotificationKind)[keyof typeof NotificationKind]

export const StorageKey = {
  Token: 'tta.token',
  User: 'tta.user',
  Theme: 'tta.theme',
  Products: 'tta.products',
  FlakyMode: 'tta.flakyMode',
  Latency: 'tta.latency',
  Notifications: 'tta.notifications',
  SavedViews: 'tta.savedViews',
} as const

export type StorageKey = (typeof StorageKey)[keyof typeof StorageKey]
