import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app'
import { StorageKey } from '@/enums'
import { readStorage } from '@/lib/storage'
import { startMockServer } from '@/mocks/browser'
import '@/index.css'

// Applied before render so the first paint already matches the stored theme.
if (readStorage<string>(StorageKey.Theme, 'light') === 'dark') {
  document.documentElement.classList.add('dark')
}

async function bootstrap() {
  await startMockServer()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
