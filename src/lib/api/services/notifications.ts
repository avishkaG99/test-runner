import { apiClient } from '@/lib/api/client'
import type { AppNotification } from '@/types'

export interface NotificationListResponse {
  items: AppNotification[]
  unreadCount: number
}

export async function listNotifications(): Promise<NotificationListResponse> {
  const { data } = await apiClient.get<NotificationListResponse>(
    '/notifications',
  )
  return data
}

export async function markNotificationRead(id: string) {
  const { data } = await apiClient.post<{
    item: AppNotification
    unreadCount: number
  }>(`/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.post<{
    updated: number
    unreadCount: number
  }>('/notifications/read-all')
  return data
}

export async function clearNotifications() {
  const { data } = await apiClient.delete<{
    cleared: true
    unreadCount: number
  }>('/notifications')
  return data
}
