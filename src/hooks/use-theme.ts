import { useCallback, useEffect, useState } from 'react'
import { StorageKey } from '@/enums'
import { readStorage, writeStorage } from '@/lib/storage'

export type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() =>
    readStorage<Theme>(StorageKey.Theme, 'light'),
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    writeStorage(StorageKey.Theme, next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(readStorage<Theme>(StorageKey.Theme, 'light') === 'dark' ? 'light' : 'dark')
  }, [setTheme])

  return { theme, setTheme, toggleTheme }
}
