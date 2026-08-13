import { useMutation } from '@tanstack/react-query'
import {
  login,
  requestPasswordReset,
  signUp,
} from '@/lib/api/services/auth'
import type { ApiError, LoginRequest, SignUpRequest } from '@/types'

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
  })
}

export function useSignUpMutation() {
  return useMutation<{ ok: true; email: string }, ApiError, SignUpRequest>({
    mutationFn: (payload) => signUp(payload),
  })
}

export function useForgotPasswordMutation() {
  return useMutation<{ ok: true }, ApiError, string>({
    mutationFn: (email) => requestPasswordReset(email),
  })
}
