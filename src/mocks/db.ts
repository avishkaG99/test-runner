import { StorageKey } from '@/enums'
import { readStorage, removeStorage, writeStorage } from '@/lib/storage'
import type { Product } from '@/types'
import { SEED_PRODUCTS } from './seed'

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
}

export function ensureSeeded() {
  const existing = readStorage<Product[] | null>(StorageKey.Products, null)
  if (existing === null) writeStorage(StorageKey.Products, SEED_PRODUCTS)
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
