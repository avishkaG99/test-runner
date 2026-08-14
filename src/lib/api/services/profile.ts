import { apiClient } from '@/lib/api/client'
import type { ChangePasswordInput, UserProfile, UserProfileInput } from '@/types'

export async function getProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<{ item: UserProfile }>('/profile')
  return data.item
}

export async function updateProfile(
  input: UserProfileInput,
): Promise<UserProfile> {
  const { data } = await apiClient.put<{ item: UserProfile }>('/profile', input)
  return data.item
}

export async function changePassword(input: ChangePasswordInput) {
  const { data } = await apiClient.post<{ ok: boolean; changedAt: string }>(
    '/profile/change-password',
    input,
  )
  return data
}
