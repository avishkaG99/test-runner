import { NotificationKind, ProductCategory, ProductStatus, TagColor, UserRole } from '@/enums'
import type { AppNotification, Product, SavedView, Tag, User } from '@/types'

export interface SeedAccount extends User {
  password: string
  locked: boolean
}

export const SEED_ACCOUNTS: SeedAccount[] = [
  {
    id: 'u-1',
    email: 'admin@test.com',
    password: 'Admin123!',
    name: 'Ada Admin',
    role: UserRole.Admin,
    locked: false,
  },
  {
    id: 'u-2',
    email: 'user@test.com',
    password: 'User123!',
    name: 'Sam Standard',
    role: UserRole.User,
    locked: false,
  },
  {
    id: 'u-3',
    email: 'locked@test.com',
    password: 'Locked123!',
    name: 'Lee Locked',
    role: UserRole.User,
    locked: true,
  },
]

/** Password-free projection for anything rendered in the UI. */
export const SEED_ACCOUNT_SUMMARIES = SEED_ACCOUNTS.map(
  ({ password: _password, ...account }) => account,
)

/** Fixed timestamps keep list ordering and rendered dates identical run to run. */
export const SEED_PRODUCTS: Product[] = [
  { id: 'p-01', name: 'Aurora Wireless Headphones', sku: 'ELEC-1001', category: ProductCategory.Electronics, price: 249.99, stock: 42, status: ProductStatus.Active, createdAt: '2025-01-06T10:00:00.000Z' },
  { id: 'p-02', name: 'Nimbus Mechanical Keyboard', sku: 'ELEC-1002', category: ProductCategory.Electronics, price: 139.0, stock: 8, status: ProductStatus.Active, createdAt: '2025-01-07T10:00:00.000Z' },
  { id: 'p-03', name: 'Vertex 4K Monitor', sku: 'ELEC-1003', category: ProductCategory.Electronics, price: 429.5, stock: 0, status: ProductStatus.Archived, createdAt: '2025-01-08T10:00:00.000Z' },
  { id: 'p-04', name: 'Halcyon Merino Sweater', sku: 'APRL-2001', category: ProductCategory.Apparel, price: 89.95, stock: 120, status: ProductStatus.Active, createdAt: '2025-01-09T10:00:00.000Z' },
  { id: 'p-05', name: 'Drift Rain Shell', sku: 'APRL-2002', category: ProductCategory.Apparel, price: 179.0, stock: 5, status: ProductStatus.Draft, createdAt: '2025-01-10T10:00:00.000Z' },
  { id: 'p-06', name: 'Solace Linen Shirt', sku: 'APRL-2003', category: ProductCategory.Apparel, price: 64.0, stock: 76, status: ProductStatus.Active, createdAt: '2025-01-11T10:00:00.000Z' },
  { id: 'p-07', name: 'Ember Cast Iron Skillet', sku: 'HOME-3001', category: ProductCategory.Home, price: 54.25, stock: 33, status: ProductStatus.Active, createdAt: '2025-01-12T10:00:00.000Z' },
  { id: 'p-08', name: 'Lumen Floor Lamp', sku: 'HOME-3002', category: ProductCategory.Home, price: 210.0, stock: 3, status: ProductStatus.Active, createdAt: '2025-01-13T10:00:00.000Z' },
  { id: 'p-09', name: 'Cove Ceramic Dinner Set', sku: 'HOME-3003', category: ProductCategory.Home, price: 145.75, stock: 19, status: ProductStatus.Draft, createdAt: '2025-01-14T10:00:00.000Z' },
  { id: 'p-10', name: 'Trailhead Running Shoes', sku: 'SPRT-4001', category: ProductCategory.Sports, price: 132.0, stock: 64, status: ProductStatus.Active, createdAt: '2025-01-15T10:00:00.000Z' },
  { id: 'p-11', name: 'Summit Climbing Rope', sku: 'SPRT-4002', category: ProductCategory.Sports, price: 189.99, stock: 12, status: ProductStatus.Active, createdAt: '2025-01-16T10:00:00.000Z' },
  { id: 'p-12', name: 'Cadence Yoga Mat', sku: 'SPRT-4003', category: ProductCategory.Sports, price: 48.5, stock: 0, status: ProductStatus.Archived, createdAt: '2025-01-17T10:00:00.000Z' },
  { id: 'p-13', name: 'The Pragmatic Tester', sku: 'BOOK-5001', category: ProductCategory.Books, price: 39.99, stock: 88, status: ProductStatus.Active, createdAt: '2025-01-18T10:00:00.000Z' },
  { id: 'p-14', name: 'Designing Resilient Systems', sku: 'BOOK-5002', category: ProductCategory.Books, price: 52.0, stock: 7, status: ProductStatus.Active, createdAt: '2025-01-19T10:00:00.000Z' },
  { id: 'p-15', name: 'Atlas of Edge Cases', sku: 'BOOK-5003', category: ProductCategory.Books, price: 27.5, stock: 150, status: ProductStatus.Draft, createdAt: '2025-01-20T10:00:00.000Z' },
  { id: 'p-16', name: 'Photon Desk Charger', sku: 'ELEC-1004', category: ProductCategory.Electronics, price: 74.0, stock: 25, status: ProductStatus.Active, createdAt: '2025-01-21T10:00:00.000Z' },
  { id: 'p-17', name: 'Quill Fountain Pen', sku: 'HOME-3004', category: ProductCategory.Home, price: 96.0, stock: 41, status: ProductStatus.Active, createdAt: '2025-01-22T10:00:00.000Z' },
  { id: 'p-18', name: 'Basalt Water Bottle', sku: 'SPRT-4004', category: ProductCategory.Sports, price: 35.0, stock: 9, status: ProductStatus.Active, createdAt: '2025-01-23T10:00:00.000Z' },
  { id: 'p-19', name: 'Meridian Wool Socks', sku: 'APRL-2004', category: ProductCategory.Apparel, price: 22.0, stock: 210, status: ProductStatus.Active, createdAt: '2025-01-24T10:00:00.000Z' },
  { id: 'p-20', name: 'Field Notes on Automation', sku: 'BOOK-5004', category: ProductCategory.Books, price: 44.25, stock: 2, status: ProductStatus.Active, createdAt: '2025-01-25T10:00:00.000Z' },
]

export const LOW_STOCK_THRESHOLD = 10

/** Fixed ids and timestamps so ordering and counts never vary between runs. */
export const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: 'n-1', title: 'Welcome aboard', body: 'Your account is ready to use.', kind: NotificationKind.Success, read: false, createdAt: '2025-02-01T09:00:00.000Z' },
  { id: 'n-2', title: 'Low stock warning', body: 'Three products are running low.', kind: NotificationKind.Warning, read: false, createdAt: '2025-02-02T09:00:00.000Z' },
  { id: 'n-3', title: 'Weekly report ready', body: 'Your inventory report has been generated.', kind: NotificationKind.Info, read: false, createdAt: '2025-02-03T09:00:00.000Z' },
  { id: 'n-4', title: 'Password changed', body: 'Your password was updated successfully.', kind: NotificationKind.Success, read: true, createdAt: '2025-02-04T09:00:00.000Z' },
  { id: 'n-5', title: 'Scheduled maintenance', body: 'Service will pause briefly on Sunday.', kind: NotificationKind.Info, read: true, createdAt: '2025-02-05T09:00:00.000Z' },
]

export const SEED_SAVED_VIEWS: SavedView[] = [
  { id: 'sv-1', name: 'Active electronics', category: ProductCategory.Electronics, status: ProductStatus.Active, createdAt: '2025-02-01T10:00:00.000Z' },
  { id: 'sv-2', name: 'Draft apparel', category: ProductCategory.Apparel, status: ProductStatus.Draft, createdAt: '2025-02-02T10:00:00.000Z' },
]

export const SEED_TAGS: Tag[] = [
  { id: 't-1', name: 'Featured', color: TagColor.Amber, productCount: 4, createdAt: '2025-02-01T11:00:00.000Z' },
  { id: 't-2', name: 'Clearance', color: TagColor.Rose, productCount: 2, createdAt: '2025-02-02T11:00:00.000Z' },
  { id: 't-3', name: 'New arrival', color: TagColor.Green, productCount: 0, createdAt: '2025-02-03T11:00:00.000Z' },
]
