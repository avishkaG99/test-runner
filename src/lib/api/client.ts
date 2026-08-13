import axios from 'axios'
import { getToken } from '@/lib/auth'
import type { ApiError } from '@/types'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Normalizes every failure into an ApiError so feature code can render
 * `error.message` without narrowing on Axios internals.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = axios.isAxiosError(error)
      ? (error.response?.data as ApiError | undefined)
      : undefined

    const normalized: ApiError = {
      message: data?.message ?? 'Something went wrong. Please try again.',
      code: data?.code,
      fieldErrors: data?.fieldErrors,
    }
    return Promise.reject(normalized)
  },
)
