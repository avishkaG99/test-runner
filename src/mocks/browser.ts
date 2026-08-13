import { FetchInterceptor } from '@mswjs/interceptors/fetch'
import { XMLHttpRequestInterceptor } from '@mswjs/interceptors/XMLHttpRequest'
import { StorageKey } from '@/enums'
import { ensureSeeded, resetDb } from './db'
import { handlers } from './handlers'

/**
 * The mock backend runs entirely in-page via request interceptors rather than
 * MSW's service worker.
 *
 * The worker is unusable here: on a fresh document load Firefox reports
 * `navigator.serviceWorker.controller === null` until the worker claims the
 * page, and MSW treats "registration exists but no controller" as a broken
 * worker and calls `location.reload()` to recover — which turns every full page
 * navigation into an infinite reload loop. Playwright drives full page loads
 * constantly, so that is fatal for a test target.
 *
 * Intercepting fetch/XHR directly removes the service worker from the picture:
 * no registration, no reloads, and requests are mocked from the first tick
 * instead of only once a worker has claimed the client.
 */
const interceptors = [new FetchInterceptor(), new XMLHttpRequestInterceptor()]

let started = false

export async function startMockServer() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('reset') === 'true') {
    resetDb()
    window.localStorage.removeItem(StorageKey.Token)
    window.localStorage.removeItem(StorageKey.User)
  } else {
    ensureSeeded()
  }

  if (started) return
  started = true

  for (const interceptor of interceptors) {
    interceptor.apply()
    interceptor.on('request', async ({ request, controller }) => {
      const response = await resolveWithHandlers(request)
      if (response) controller.respondWith(response)
    })
  }
}

/** Runs the request past each handler, returning the first mocked response. */
async function resolveWithHandlers(request: Request): Promise<Response | null> {
  const url = new URL(request.url)
  // Everything outside /api (documents, modules, assets) passes through.
  if (!url.pathname.startsWith('/api')) return null

  for (const handler of handlers) {
    const result = await handler.run({
      request: request.clone() as Parameters<typeof handler.run>[0]['request'],
      requestId: crypto.randomUUID(),
    })
    if (result?.response) return result.response
  }
  return null
}
