import { delay, http, HttpResponse } from 'msw'
import { ProductCategory } from '@/enums'
import type {
  ApiError,
  DashboardStats,
  LoginRequest,
  Paginated,
  Product,
  ProductInput,
  SignUpRequest,
} from '@/types'
import {
  getLatency,
  getNotifications,
  getProducts,
  isFlakyMode,
  nextProductId,
  resetDb,
  saveNotifications,
  saveProducts,
} from './db'
import { LOW_STOCK_THRESHOLD, SEED_ACCOUNTS } from './seed'

const SESSION_TTL_MS = 60 * 60 * 1000

function error(status: number, body: ApiError) {
  return HttpResponse.json(body, { status })
}

/**
 * Applies the simulated latency, and in flaky mode fails ~30% of reads so retry
 * UIs can be exercised deliberately. Returns a response to short-circuit with,
 * or null to continue.
 */
async function simulateNetwork(flakeable = true) {
  await delay(getLatency())
  if (flakeable && isFlakyMode() && Math.random() < 0.3) {
    return error(503, {
      message: 'Service temporarily unavailable. Please retry.',
      code: 'FLAKY',
    })
  }
  return null
}

function requireAuth(request: Request) {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return error(401, { message: 'Not authenticated.', code: 'UNAUTHENTICATED' })
  }
  return null
}

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await delay(getLatency())
    const body = (await request.json()) as LoginRequest
    const email = body.email?.trim().toLowerCase() ?? ''

    const fieldErrors: Record<string, string> = {}
    if (!email) fieldErrors.email = 'Email is required.'
    if (!body.password) fieldErrors.password = 'Password is required.'
    if (Object.keys(fieldErrors).length > 0) {
      return error(422, { message: 'Please fix the errors below.', fieldErrors })
    }

    const account = SEED_ACCOUNTS.find((a) => a.email === email)
    if (!account || account.password !== body.password) {
      return error(401, {
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      })
    }
    if (account.locked) {
      return error(403, {
        message: 'This account is locked. Contact your administrator.',
        code: 'ACCOUNT_LOCKED',
      })
    }

    const { password: _password, locked: _locked, ...user } = account
    return HttpResponse.json({
      token: `mock-token-${account.id}`,
      user,
      expiresAt: Date.now() + SESSION_TTL_MS,
    })
  }),

  http.post('/api/auth/signup', async ({ request }) => {
    await delay(getLatency())
    const body = (await request.json()) as SignUpRequest
    const email = body.email?.trim().toLowerCase() ?? ''

    // Magic trigger documented in the README: forces a server error.
    if (email.includes('fail')) {
      return error(500, {
        message: 'Unexpected server error. Please try again later.',
        code: 'FORCED_ERROR',
      })
    }
    if (SEED_ACCOUNTS.some((a) => a.email === email)) {
      return error(409, {
        message: 'An account with this email already exists.',
        fieldErrors: { email: 'This email is already registered.' },
      })
    }
    return HttpResponse.json({ ok: true, email }, { status: 201 })
  }),

  http.post('/api/auth/forgot-password', async ({ request }) => {
    await delay(getLatency())
    const body = (await request.json()) as { email: string }
    if (body.email?.includes('fail')) {
      return error(500, {
        message: 'Unexpected server error. Please try again later.',
        code: 'FORCED_ERROR',
      })
    }
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/dashboard/stats', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    const failure = await simulateNetwork()
    if (failure) return failure

    const products = getProducts()
    const stats: DashboardStats = {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status === 'active').length,
      lowStock: products.filter((p) => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD).length,
      totalValue: Number(
        products.reduce((sum, p) => sum + p.price * p.stock, 0).toFixed(2),
      ),
    }
    return HttpResponse.json(stats)
  }),

  http.get('/api/products', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    const failure = await simulateNetwork()
    if (failure) return failure

    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase() ?? ''
    const category = url.searchParams.get('category') ?? 'all'
    const sortBy = (url.searchParams.get('sortBy') ?? 'name') as keyof Product
    const sortDir = url.searchParams.get('sortDir') === 'desc' ? -1 : 1
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
    const pageSize = Math.max(1, Number(url.searchParams.get('pageSize') ?? 10))

    let items = getProducts()
    if (search) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search),
      )
    }
    if (category !== 'all') {
      items = items.filter((p) => p.category === category)
    }
    items = [...items].sort((a, b) => {
      const av = a[sortBy]
      const bv = b[sortBy]
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * sortDir
      }
      return String(av).localeCompare(String(bv)) * sortDir
    })

    const total = items.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const start = (page - 1) * pageSize
    const body: Paginated<Product> = {
      items: items.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages,
    }
    return HttpResponse.json(body)
  }),

  http.get('/api/products/:id', async ({ request, params }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    const failure = await simulateNetwork()
    if (failure) return failure

    const product = getProducts().find((p) => p.id === params.id)
    if (!product) return error(404, { message: 'Product not found.' })
    return HttpResponse.json(product)
  }),

  http.post('/api/products', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(getLatency())

    const input = (await request.json()) as ProductInput
    if (input.name?.toLowerCase().includes('fail')) {
      return error(500, {
        message: 'Unexpected server error. Please try again later.',
        code: 'FORCED_ERROR',
      })
    }

    const products = getProducts()
    if (products.some((p) => p.sku === input.sku)) {
      return error(409, {
        message: 'A product with this SKU already exists.',
        fieldErrors: { sku: 'SKU must be unique.' },
      })
    }

    const created: Product = {
      ...input,
      id: nextProductId(products),
      createdAt: new Date().toISOString(),
    }
    saveProducts([...products, created])
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put('/api/products/:id', async ({ request, params }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(getLatency())

    const input = (await request.json()) as ProductInput
    if (input.name?.toLowerCase().includes('fail')) {
      return error(500, {
        message: 'Unexpected server error. Please try again later.',
        code: 'FORCED_ERROR',
      })
    }

    const products = getProducts()
    const index = products.findIndex((p) => p.id === params.id)
    if (index === -1) return error(404, { message: 'Product not found.' })

    const updated: Product = { ...products[index], ...input }
    const next = [...products]
    next[index] = updated
    saveProducts(next)
    return HttpResponse.json(updated)
  }),

  http.delete('/api/products/:id', async ({ request, params }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(getLatency())

    const products = getProducts()
    if (!products.some((p) => p.id === params.id)) {
      return error(404, { message: 'Product not found.' })
    }
    saveProducts(products.filter((p) => p.id !== params.id))
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/products/bulk-delete', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(getLatency())

    const { ids } = (await request.json()) as { ids: string[] }
    const products = getProducts()
    const remaining = products.filter((p) => !ids.includes(p.id))
    saveProducts(remaining)
    return HttpResponse.json({ deleted: products.length - remaining.length })
  }),

  http.get('/api/categories', async () => {
    await delay(getLatency())
    return HttpResponse.json(Object.values(ProductCategory))
  }),

  http.post('/api/forms/submit', async ({ request }) => {
    await delay(getLatency())
    const payload = (await request.json()) as Record<string, unknown>
    const email = typeof payload.email === 'string' ? payload.email : ''
    if (email.includes('fail')) {
      return error(500, {
        message: 'Unexpected server error. Please try again later.',
        code: 'FORCED_ERROR',
      })
    }
    return HttpResponse.json({ ok: true, received: payload }, { status: 201 })
  }),

  http.get('/api/notifications', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    const failure = await simulateNetwork()
    if (failure) return failure

    const items = getNotifications()
    return HttpResponse.json({
      items,
      unreadCount: items.filter((n) => !n.read).length,
    })
  }),

  http.post('/api/notifications/:id/read', async ({ request, params }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(getLatency())

    const items = getNotifications()
    const index = items.findIndex((n) => n.id === params.id)
    if (index === -1) return error(404, { message: 'Notification not found.' })

    const next = [...items]
    next[index] = { ...next[index], read: true }
    saveNotifications(next)
    return HttpResponse.json({
      item: next[index],
      unreadCount: next.filter((n) => !n.read).length,
    })
  }),

  http.post('/api/notifications/read-all', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(getLatency())

    const items = getNotifications().map((n) => ({ ...n, read: true }))
    saveNotifications(items)
    return HttpResponse.json({ updated: items.length, unreadCount: 0 })
  }),

  http.delete('/api/notifications', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(getLatency())

    saveNotifications([])
    return HttpResponse.json({ cleared: true, unreadCount: 0 })
  }),

  http.post('/api/app/reset', async () => {
    resetDb()
    return HttpResponse.json({ ok: true })
  }),
]
