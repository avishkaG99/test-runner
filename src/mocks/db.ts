import { StorageKey } from '@/enums'
import { readStorage, removeStorage, writeStorage } from '@/lib/storage'
import type { AppNotification, Product, SavedView, Tag, UserProfile } from '@/types'
import { SEED_NOTIFICATIONS, SEED_PRODUCTS, SEED_PROFILES, SEED_SAVED_VIEWS, SEED_TAGS } from './seed'

/**
 * In-browser "database" backing the MSW handlers. Persisted to localStorage so
 * mutations survive a reload, and restorable to the exact seed via resetDb().
 */
export function getProducts(): Product[] {
  return readStorage<Product[]>(StorageKey.Products, SEED_PRODUCTS)
}

export function saveProducts(products: Product[]) {
  writeStorage(StorageKey.Products, products)
}

export function resetDb() {
  removeStorage(StorageKey.Products)
  writeStorage(StorageKey.Products, SEED_PRODUCTS)
  removeStorage(StorageKey.Notifications)
  writeStorage(StorageKey.Notifications, SEED_NOTIFICATIONS)
  removeStorage(StorageKey.SavedViews)
  writeStorage(StorageKey.SavedViews, SEED_SAVED_VIEWS)
  removeStorage(StorageKey.Tags)
  writeStorage(StorageKey.Tags, SEED_TAGS)
  removeStorage(StorageKey.Profile)
  writeStorage(StorageKey.Profile, SEED_PROFILES)
}

export function getTags(): Tag[] {
  return readStorage<Tag[]>(StorageKey.Tags, SEED_TAGS)
}

export function saveTags(tags: Tag[]) {
  writeStorage(StorageKey.Tags, tags)
}

export function nextTagId(tags: Tag[]): string {
  const maxN = tags.reduce((max, t) => {
    const n = Number.parseInt(t.id.replace(/^t-/, ''), 10)
    return Number.isFinite(n) && n > max ? n : max
  }, 0)
  return `t-${maxN + 1}`
}

export function getProfiles(): Record<string, UserProfile> {
  return readStorage<Record<string, UserProfile>>(
    StorageKey.Profile,
    SEED_PROFILES,
  )
}

export function saveProfiles(profiles: Record<string, UserProfile>) {
  writeStorage(StorageKey.Profile, profiles)
}

export function getSavedViews(): SavedView[] {
  return readStorage<SavedView[]>(StorageKey.SavedViews, SEED_SAVED_VIEWS)
}

export function saveSavedViews(views: SavedView[]) {
  writeStorage(StorageKey.SavedViews, views)
}

export function nextSavedViewId(views: SavedView[]): string {
  const maxN = views.reduce((max, v) => {
    const n = Number.parseInt(v.id.replace(/^sv-/, ''), 10)
    return Number.isFinite(n) && n > max ? n : max
  }, 0)
  return `sv-${maxN + 1}`
}

export function getNotifications(): AppNotification[] {
  return readStorage<AppNotification[]>(
    StorageKey.Notifications,
    SEED_NOTIFICATIONS,
  )
}

export function saveNotifications(items: AppNotification[]) {
  writeStorage(StorageKey.Notifications, items)
}

export function ensureSeeded() {
  const existing = readStorage<Product[] | null>(StorageKey.Products, null)
  if (existing === null) writeStorage(StorageKey.Products, SEED_PRODUCTS)

  const notifications = readStorage<AppNotification[] | null>(
    StorageKey.Notifications,
    null,
  )
  if (notifications === null) {
    writeStorage(StorageKey.Notifications, SEED_NOTIFICATIONS)
  }

  const savedViews = readStorage<SavedView[] | null>(StorageKey.SavedViews, null)
  if (savedViews === null) writeStorage(StorageKey.SavedViews, SEED_SAVED_VIEWS)

  const tags = readStorage<Tag[] | null>(StorageKey.Tags, null)
  if (tags === null) writeStorage(StorageKey.Tags, SEED_TAGS)

  const profiles = readStorage<Record<string, UserProfile> | null>(
    StorageKey.Profile,
    null,
  )
  if (profiles === null) writeStorage(StorageKey.Profile, SEED_PROFILES)
}

/** Network simulation knobs, toggleable at runtime from the Settings page. */
export function getLatency(): number {
  return readStorage<number>(StorageKey.Latency, 400)
}

export function setLatency(ms: number) {
  writeStorage(StorageKey.Latency, ms)
}

export function isFlakyMode(): boolean {
  return readStorage<boolean>(StorageKey.FlakyMode, false)
}

export function setFlakyMode(enabled: boolean) {
  writeStorage(StorageKey.FlakyMode, enabled)
}

export function nextProductId(products: Product[]): string {
  const maxN = products.reduce((max, p) => {
    const n = Number.parseInt(p.id.replace(/^p-/, ''), 10)
    return Number.isFinite(n) && n > max ? n : max
  }, 0)
  return `p-${String(maxN + 1).padStart(2, '0')}`
}
