import { apiClient } from '@/lib/api/client'
import type { LoginRequest, LoginResponse, SignUpRequest } from '@/types'

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
  return data
}

export async function signUp(payload: SignUpRequest) {
  const { data } = await apiClient.post<{ ok: true; email: string }>(
    '/auth/signup',
    payload,
  )
  return data
}

export async function requestPasswordReset(email: string) {
  const { data } = await apiClient.post<{ ok: true }>('/auth/forgot-password', {
    email,
  })
  return data
}
