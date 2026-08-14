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

export const TagColor = {
  Slate: 'slate',
  Blue: 'blue',
  Green: 'green',
  Amber: 'amber',
  Rose: 'rose',
} as const

export type TagColor = (typeof TagColor)[keyof typeof TagColor]

export const Language = {
  English: 'en',
  French: 'fr',
  German: 'de',
  Japanese: 'ja',
} as const

export type Language = (typeof Language)[keyof typeof Language]

/** Human-readable labels for the language select. */
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
}

/**
 * Fixed timezone list. Deliberately short and hard-coded rather than read from
 * Intl, so the options are identical on every machine running the suite.
 */
export const TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Colombo',
  'Asia/Tokyo',
] as const

export type Timezone = (typeof TIMEZONES)[number]

export const StorageKey = {
  Token: 'tta.token',
  User: 'tta.user',
  Theme: 'tta.theme',
  Products: 'tta.products',
  FlakyMode: 'tta.flakyMode',
  Latency: 'tta.latency',
  Notifications: 'tta.notifications',
  SavedViews: 'tta.savedViews',
  Tags: 'tta.tags',
  Profile: 'tta.profile',
} as const

export type StorageKey = (typeof StorageKey)[keyof typeof StorageKey]
