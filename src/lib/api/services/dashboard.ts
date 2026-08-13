import { apiClient } from '@/lib/api/client'
import type { DashboardStats } from '@/types'

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/dashboard/stats')
  return data
}

export async function resetAppData() {
  const { data } = await apiClient.post<{ ok: true }>('/app/reset')
  return data
}
