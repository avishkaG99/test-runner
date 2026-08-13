import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSavedView,
  deleteSavedView,
  listSavedViews,
  type SavedViewInput,
} from '@/lib/api/services/saved-views'

export const savedViewKeys = {
  all: ['saved-views'] as const,
  list: () => ['saved-views', 'list'] as const,
}

export function useSavedViewsQuery() {
  return useQuery({
    queryKey: savedViewKeys.list(),
    queryFn: listSavedViews,
  })
}

export function useCreateSavedViewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SavedViewInput) => createSavedView(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: savedViewKeys.all })
    },
  })
}

export function useDeleteSavedViewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSavedView(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: savedViewKeys.all })
    },
  })
}
