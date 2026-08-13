import { apiClient } from '@/lib/api/client'
import type { SavedView } from '@/types'

export interface SavedViewListResponse {
  items: SavedView[]
}

export interface SavedViewInput {
  name: string
  category: SavedView['category']
  status: SavedView['status']
}

export async function listSavedViews(): Promise<SavedViewListResponse> {
  const { data } = await apiClient.get<SavedViewListResponse>('/saved-views')
  return data
}

export async function createSavedView(input: SavedViewInput) {
  const { data } = await apiClient.post<{ item: SavedView }>(
    '/saved-views',
    input,
  )
  return data
}

export async function deleteSavedView(id: string) {
  const { data } = await apiClient.delete<{ deleted: true }>(
    `/saved-views/${id}`,
  )
  return data
}
