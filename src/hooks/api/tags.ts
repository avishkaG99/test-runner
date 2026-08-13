import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTag,
  deleteTag,
  listTags,
  type TagInput,
} from '@/lib/api/services/tags'

export const tagKeys = {
  all: ['tags'] as const,
  list: () => ['tags', 'list'] as const,
}

export function useTagsQuery() {
  return useQuery({ queryKey: tagKeys.list(), queryFn: listTags })
}

export function useCreateTagMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TagInput) => createTag(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

export function useDeleteTagMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}
