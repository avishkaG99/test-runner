import { StorageKey } from '@/enums'
import { readStorage, removeStorage, writeStorage } from '@/lib/storage'
import type { AuthSession, User } from '@/types'

export function getSession(): AuthSession | null {
  const token = readStorage<string | null>(StorageKey.Token, null)
  const stored = readStorage<{ user: User; expiresAt: number } | null>(
    StorageKey.User,
    null,
  )
  if (!token || !stored) return null
  if (stored.expiresAt <= Date.now()) {
    clearSession()
    return null
  }
  return { token, user: stored.user, expiresAt: stored.expiresAt }
}

export function setSession(session: AuthSession) {
  writeStorage(StorageKey.Token, session.token)
  writeStorage(StorageKey.User, {
    user: session.user,
    expiresAt: session.expiresAt,
  })
}

export function clearSession() {
  removeStorage(StorageKey.Token)
  removeStorage(StorageKey.User)
}

/** Backdates the stored expiry so the next guard check treats it as expired. */
export function expireSession() {
  const stored = readStorage<{ user: User; expiresAt: number } | null>(
    StorageKey.User,
    null,
  )
  if (!stored) return
  writeStorage(StorageKey.User, { ...stored, expiresAt: Date.now() - 1000 })
}

export function getToken(): string | null {
  return getSession()?.token ?? null
}
