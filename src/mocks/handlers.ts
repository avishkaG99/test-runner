import { delay, http, HttpResponse } from 'msw'
import { Language, ProductCategory, TIMEZONES } from '@/enums'
import type { Timezone } from '@/enums'
import type {
  ApiError,
  ChangePasswordInput,
  DashboardStats,
  LoginRequest,
  Paginated,
  Product,
  ProductInput,
  SavedView,
  SignUpRequest,
  Tag,
  UserProfile,
  UserProfileInput,
} from '@/types'
import {
  getLatency,
  getNotifications,
  getProducts,
  getProfiles,
  getSavedViews,
  getTags,
  isFlakyMode,
  nextProductId,
  nextSavedViewId,
  nextTagId,
  resetDb,
  saveNotifications,
  saveProducts,
  saveProfiles,
  saveSavedViews,
  saveTags,
} from './db'
import { LOW_STOCK_THRESHOLD, SEED_ACCOUNTS } from './seed'

const SESSION_TTL_MS = 60 * 60 * 1000

export const BIO_MAX_LENGTH = 280

const LANGUAGES = Object.values(Language)

/**
 * Recovers the caller's user id from the bearer token.
 *
 * Tokens are minted as `mock-token-<userId>` at login, so the id is readable
 * without any session store. Returns null when the header is missing or shaped
 * differently, and callers treat that as "no profile".
 */
function userIdFromRequest(request: Request): string | null {
  const header = request.headers.get('Authorization') ?? ''
  const token = header.replace(/^Bearer\s+/, '')
  const id = token.replace(/^mock-token-/, '')
  return id && id !== token ? id : null
}

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

  http.get('/api/saved-views', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    const failure = await simulateNetwork()
    if (failure) return failure

    return HttpResponse.json({ items: getSavedViews() })
  }),

  http.post('/api/saved-views', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(getLatency())

    const payload = (await request.json()) as Partial<SavedView>
    const name = (payload.name ?? '').trim()
    if (!name) return error(400, { message: 'Name is required.' })
    if (name.length > 40) {
      return error(400, { message: 'Name must be 40 characters or fewer.' })
    }

    const views = getSavedViews()
    if (views.some((v) => v.name.toLowerCase() === name.toLowerCase())) {
      return error(409, { message: 'A view with that name already exists.' })
    }

    const view: SavedView = {
      id: nextSavedViewId(views),
      name,
      category: payload.category ?? 'all',
      status: payload.status ?? 'all',
      createdAt: new Date().toISOString(),
    }
    saveSavedViews([...views, view])
    return HttpResponse.json({ item: view }, { status: 201 })
  }),

  http.delete('/api/saved-views/:id', async ({ request, params }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(getLatency())

    const views = getSavedViews()
    if (!views.some((v) => v.id === params.id)) {
      return error(404, { message: 'Saved view not found.' })
    }
    saveSavedViews(views.filter((v) => v.id !== params.id))
    return HttpResponse.json({ deleted: true })
  }),

  http.get('/api/tags', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    const failure = await simulateNetwork()
    if (failure) return failure

    return HttpResponse.json({ items: getTags() })
  }),

  http.post('/api/tags', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(getLatency())

    const payload = (await request.json()) as Partial<Tag>
    const name = (payload.name ?? '').trim()
    if (!name) return error(400, { message: 'Tag name is required.' })
    if (name.length > 24) {
      return error(400, { message: 'Tag name must be 24 characters or fewer.' })
    }

    const tags = getTags()
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      return error(409, { message: 'A tag with that name already exists.' })
    }

    const tag: Tag = {
      id: nextTagId(tags),
      name,
      color: payload.color ?? 'slate',
      productCount: 0,
      createdAt: new Date().toISOString(),
    }
    saveTags([...tags, tag])
    return HttpResponse.json({ item: tag }, { status: 201 })
  }),

  http.delete('/api/tags/:id', async ({ request, params }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(getLatency())

    const tags = getTags()
    const target = tags.find((t) => t.id === params.id)
    if (!target) return error(404, { message: 'Tag not found.' })
    if (target.productCount > 0) {
      return error(409, {
        message: `"${target.name}" is applied to ${target.productCount} product(s) and cannot be deleted.`,
      })
    }
    saveTags(tags.filter((t) => t.id !== params.id))
    return HttpResponse.json({ deleted: true })
  }),

  http.get('/api/profile', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    const failure = await simulateNetwork()
    if (failure) return failure

    const userId = userIdFromRequest(request)
    const profile = userId ? getProfiles()[userId] : undefined
    if (!profile) return error(404, { message: 'Profile not found.' })

    return HttpResponse.json({ item: profile })
  }),

  http.put('/api/profile', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(getLatency())

    const userId = userIdFromRequest(request)
    const profiles = getProfiles()
    const current = userId ? profiles[userId] : undefined
    if (!userId || !current) {
      return error(404, { message: 'Profile not found.' })
    }

    const input = (await request.json()) as Partial<UserProfileInput>
    const displayName = (input.displayName ?? '').trim()
    const jobTitle = (input.jobTitle ?? '').trim()
    const bio = (input.bio ?? '').trim()

    // Magic trigger, consistent with products and sign-up.
    if (displayName.toLowerCase().includes('fail')) {
      return error(500, {
        message: 'Unexpected server error. Please try again later.',
        code: 'FORCED_ERROR',
      })
    }

    const fieldErrors: Record<string, string> = {}
    if (!displayName) {
      fieldErrors.displayName = 'Display name is required.'
    } else if (displayName.length < 2) {
      fieldErrors.displayName = 'Display name must be at least 2 characters.'
    } else if (displayName.length > 40) {
      fieldErrors.displayName = 'Display name must be 40 characters or fewer.'
    }
    if (jobTitle.length > 60) {
      fieldErrors.jobTitle = 'Job title must be 60 characters or fewer.'
    }
    if (bio.length > BIO_MAX_LENGTH) {
      fieldErrors.bio = `Bio must be ${BIO_MAX_LENGTH} characters or fewer.`
    }
    if (input.timezone && !TIMEZONES.includes(input.timezone as Timezone)) {
      fieldErrors.timezone = 'Unknown timezone.'
    }
    if (input.language && !LANGUAGES.includes(input.language)) {
      fieldErrors.language = 'Unsupported language.'
    }
    if (Object.keys(fieldErrors).length > 0) {
      return error(422, { message: 'Please fix the errors below.', fieldErrors })
    }

    const updated: UserProfile = {
      ...current,
      displayName,
      jobTitle,
      bio,
      timezone: input.timezone ?? current.timezone,
      language: input.language ?? current.language,
      marketingEmails: input.marketingEmails ?? current.marketingEmails,
      updatedAt: new Date().toISOString(),
    }
    saveProfiles({ ...profiles, [userId]: updated })
    return HttpResponse.json({ item: updated })
  }),

  http.post('/api/profile/change-password', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(getLatency())

    const userId = userIdFromRequest(request)
    const account = SEED_ACCOUNTS.find((a) => a.id === userId)
    if (!account) return error(404, { message: 'Profile not found.' })

    const body = (await request.json()) as Partial<ChangePasswordInput>
    const currentPassword = body.currentPassword ?? ''
    const newPassword = body.newPassword ?? ''

    const fieldErrors: Record<string, string> = {}
    if (!currentPassword) {
      fieldErrors.currentPassword = 'Current password is required.'
    }
    if (!newPassword) {
      fieldErrors.newPassword = 'New password is required.'
    } else if (newPassword.length < 8) {
      fieldErrors.newPassword = 'New password must be at least 8 characters.'
    } else if (newPassword === currentPassword) {
      fieldErrors.newPassword =
        'New password must be different from the current one.'
    }
    if (Object.keys(fieldErrors).length > 0) {
      return error(422, { message: 'Please fix the errors below.', fieldErrors })
    }

    // Checked after shape validation so a wrong password is reported on its own.
    if (currentPassword !== account.password) {
      return error(422, {
        message: 'Please fix the errors below.',
        code: 'INVALID_CREDENTIALS',
        fieldErrors: { currentPassword: 'Current password is incorrect.' },
      })
    }

    // Deliberately not persisted: the seeded accounts must keep working across
    // reloads, and a changed password would strand the whole suite.
    return HttpResponse.json({ ok: true, changedAt: new Date().toISOString() })
  }),

  http.post('/api/app/reset', async () => {
    resetDb()
    return HttpResponse.json({ ok: true })
  }),
]
