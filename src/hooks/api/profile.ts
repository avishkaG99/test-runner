import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changePassword,
  getProfile,
  updateProfile,
} from '@/lib/api/services/profile'
import type { ChangePasswordInput, UserProfileInput } from '@/types'

export const profileKeys = {
  all: ['profile'] as const,
  detail: () => ['profile', 'detail'] as const,
}

export function useProfileQuery() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: getProfile,
  })
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UserProfileInput) => updateProfile(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}

export function useChangePasswordMutation() {
  // No invalidation: the password is never persisted, so nothing cached changes.
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changePassword(input),
  })
}
