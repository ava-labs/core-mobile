import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { showSnackbar } from 'common/utils/toast'
import { getRecurringSchedulesService } from '../services/RecurringSchedulesService.singleton'
import { RECURRING_SCHEDULES_QK } from './useRecurringSchedules'
import type { RecurringSchedulesError } from '../services/RecurringSchedulesService'
import type { Schedule } from '../types'

type SnapshotEntry = [QueryKey, Schedule[] | undefined]

export function useCancelRecurringSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, address }: { orderId: string; address: string }) =>
      getRecurringSchedulesService().cancel({ orderId, address }),
    onMutate: async ({ orderId }: { orderId: string; address: string }) => {
      await qc.cancelQueries({ queryKey: RECURRING_SCHEDULES_QK })
      const previous: SnapshotEntry[] = qc.getQueriesData<Schedule[]>({
        queryKey: RECURRING_SCHEDULES_QK
      })
      qc.setQueriesData<Schedule[]>(
        { queryKey: RECURRING_SCHEDULES_QK },
        prev =>
          prev?.map(s =>
            s.orderId === orderId
              ? { ...s, status: 'cancelled' as const, nextExecutionAt: null }
              : s
          )
      )
      return { previous }
    },
    onError: (
      err: unknown,
      _vars: unknown,
      ctx: { previous: SnapshotEntry[] } | undefined
    ) => {
      // Roll back optimistic update
      ctx?.previous?.forEach(([key, value]) =>
        qc.setQueryData<Schedule[]>(key, value)
      )
      const kind = (err as Partial<RecurringSchedulesError>)?.kind
      if (kind === 'not_cancellable') {
        showSnackbar('This schedule has already finished')
      } else if (kind === 'not_found') {
        showSnackbar('Unable to remove')
      } else {
        showSnackbar('Try again')
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: RECURRING_SCHEDULES_QK })
    }
  })
}
