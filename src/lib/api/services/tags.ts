import { apiClient } from '@/lib/api/client'
import type { Tag } from '@/types'

export interface TagListResponse {
  items: Tag[]
}

export interface TagInput {
  name: string
  color: Tag['color']
}

export async function listTags(): Promise<TagListResponse> {
  const { data } = await apiClient.get<TagListResponse>('/tags')
  return data
}

export async function createTag(input: TagInput) {
  const { data } = await apiClient.post<{ item: Tag }>('/tags', input)
  return data
}

export async function deleteTag(id: string) {
  const { data } = await apiClient.delete<{ deleted: true }>(`/tags/${id}`)
  return data
}
