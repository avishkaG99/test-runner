import { apiClient } from '@/lib/api/client'

export interface FormSubmitResponse {
  ok: true
  received: Record<string, unknown>
}

export async function submitShowcaseForm(
  payload: Record<string, unknown>,
): Promise<FormSubmitResponse> {
  const { data } = await apiClient.post<FormSubmitResponse>(
    '/forms/submit',
    payload,
  )
  return data
}
