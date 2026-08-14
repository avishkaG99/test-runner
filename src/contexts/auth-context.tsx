import { createContext, useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { UserRole } from '@/enums'
import {
  clearSession,
  expireSession,
  getSession,
  setSession,
} from '@/lib/auth'
import type { AuthSession, User } from '@/types'

export interface AuthContextValue {
  session: AuthSession | null
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  signIn: (session: AuthSession) => void
  signOut: () => void
  forceExpire: () => void
  /** Patches the session user in place, e.g. after a profile save. */
  updateUser: (patch: Partial<User>) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() =>
    getSession(),
  )

  const signIn = useCallback((next: AuthSession) => {
    setSession(next)
    setSessionState(next)
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setSessionState(null)
  }, [])

  const forceExpire = useCallback(() => {
    expireSession()
    setSessionState(null)
  }, [])

  const updateUser = useCallback((patch: Partial<User>) => {
    setSessionState((prev) => {
      if (!prev) return prev
      const next = { ...prev, user: { ...prev.user, ...patch } }
      setSession(next)
      return next
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      isAdmin: session?.user.role === UserRole.Admin,
      signIn,
      signOut,
      forceExpire,
      updateUser,
    }),
    [session, signIn, signOut, forceExpire, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
