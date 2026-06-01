import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { getRecurringSchedulesService } from '../services/RecurringSchedulesService.singleton'

export const RECURRING_SCHEDULES_QK = [
  ReactQueryKeys.RECURRING_SCHEDULES
] as const

export function useRecurringSchedules(
  ownerAddress: string | undefined,
  chainId: number | undefined
) {
  return useQuery({
    enabled:
      ownerAddress !== undefined &&
      ownerAddress !== '' &&
      chainId !== undefined,
    queryKey: [...RECURRING_SCHEDULES_QK, ownerAddress, chainId],
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    queryFn: () =>
      getRecurringSchedulesService().list({
        address: ownerAddress!,
        chainId: chainId!
        // Intentionally omit `status` — list screen needs all four (active/completed/cancelled/paused) to render badges.
      })
  })
}
