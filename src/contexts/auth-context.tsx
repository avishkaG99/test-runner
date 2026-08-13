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

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      isAdmin: session?.user.role === UserRole.Admin,
      signIn,
      signOut,
      forceExpire,
    }),
    [session, signIn, signOut, forceExpire],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
