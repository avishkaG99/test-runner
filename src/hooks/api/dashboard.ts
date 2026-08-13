import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getDashboardStats,
  resetAppData,
} from '@/lib/api/services/dashboard'

export const dashboardKeys = {
  stats: ['dashboard', 'stats'] as const,
}

export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: getDashboardStats,
  })
}

export function useResetAppDataMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resetAppData,
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
