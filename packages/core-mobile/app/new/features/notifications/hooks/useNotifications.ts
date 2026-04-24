import { useMemo, useCallback } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectAccounts } from 'store/account'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import Logger from 'utils/Logger'
import { useDeviceArn } from 'common/hooks/useDeviceArn'
import NotificationCenterService from '../services/NotificationCenterService'
import { AppNotification, BackendNotification, NotificationTab } from '../types'
import { filterByOwnedAddresses, filterByTab } from '../utils'

/**
 * Hook to fetch notifications from backend
 */
export function useBackendNotifications(): UseQueryResult<
  BackendNotification[],
  Error
> {
  const deviceArn = useDeviceArn()

  return useQuery<BackendNotification[], Error>({
    queryKey: [ReactQueryKeys.NOTIFICATION_CENTER_LIST, deviceArn],
    queryFn: async () =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      NotificationCenterService.fetchNotifications(deviceArn!),
    enabled: !!deviceArn,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 1 // 1 minute
  })
}

/**
 * Set of lowercased EVM addresses currently owned by the user's wallets. Used
 * to drop balance-change notifications for wallets that were imported and then
 * deleted (CP-14129) before the backend has caught up.
 */
function useOwnedAddresses(): Set<string> {
  const accounts = useSelector(selectAccounts)

  return useMemo(
    () =>
      new Set(
        Object.values(accounts).map(account => account.addressC.toLowerCase())
      ),
    [accounts]
  )
}

/**
 * Hook to get notifications with tab filtering.
 * All notifications returned by the API are unread.
 */
export function useNotifications(tab: NotificationTab = NotificationTab.ALL): {
  notifications: BackendNotification[]
  isLoading: boolean
} {
  const { data: backendNotifications, isLoading } = useBackendNotifications()
  const ownedAddresses = useOwnedAddresses()

  const notifications = useMemo(() => {
    const owned = filterByOwnedAddresses(
      backendNotifications ?? [],
      ownedAddresses
    )
    const sorted: AppNotification[] = [...owned].sort(
      (a, b) => b.timestamp - a.timestamp
    )

    return filterByTab(sorted, tab)
  }, [backendNotifications, ownedAddresses, tab])

  return {
    notifications,
    isLoading
  }
}

/**
 * Hook for unread count (for bell badge).
 * All notifications returned by the API are unread.
 */
export function useUnreadCount(): number {
  const { data: backendNotifications } = useBackendNotifications()
  const ownedAddresses = useOwnedAddresses()

  return useMemo(
    () =>
      filterByOwnedAddresses(backendNotifications ?? [], ownedAddresses).length,
    [backendNotifications, ownedAddresses]
  )
}

/**
 * Hook to mark a backend notification as read
 */
export function useMarkAsRead(): UseMutationResult<
  void,
  Error,
  string,
  {
    previousData: BackendNotification[] | undefined
  }
> {
  const deviceArn = useDeviceArn()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!deviceArn) {
        throw new Error('Device ARN not available')
      }
      await NotificationCenterService.markAsRead(deviceArn, notificationId)
    },
    onMutate: async (notificationId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [ReactQueryKeys.NOTIFICATION_CENTER_LIST]
      })

      // Save previous data for rollback
      const previousData = queryClient.getQueryData<BackendNotification[]>([
        ReactQueryKeys.NOTIFICATION_CENTER_LIST,
        deviceArn
      ])

      // Optimistically remove from cache
      if (previousData) {
        queryClient.setQueryData<BackendNotification[]>(
          [ReactQueryKeys.NOTIFICATION_CENTER_LIST, deviceArn],
          old => old?.filter(n => n.id !== notificationId)
        )
      }

      return { previousData }
    },
    onError: (_err, _notificationId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          [ReactQueryKeys.NOTIFICATION_CENTER_LIST, deviceArn],
          context.previousData
        )
      }
    }
  })
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead(): UseMutationResult<
  void,
  Error,
  void,
  { previousData: BackendNotification[] | undefined }
> {
  const deviceArn = useDeviceArn()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (deviceArn) {
        await NotificationCenterService.markAllAsRead(deviceArn)
      }
    },
    onMutate: async () => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: [ReactQueryKeys.NOTIFICATION_CENTER_LIST]
      })

      // Save previous data for potential rollback
      const previousData = queryClient.getQueryData<BackendNotification[]>([
        ReactQueryKeys.NOTIFICATION_CENTER_LIST,
        deviceArn
      ])

      // Optimistically clear all from cache
      queryClient.setQueryData<BackendNotification[]>(
        [ReactQueryKeys.NOTIFICATION_CENTER_LIST, deviceArn],
        []
      )

      return { previousData }
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          [ReactQueryKeys.NOTIFICATION_CENTER_LIST, deviceArn],
          context.previousData
        )
      }
    }
  })
}

/**
 * Hook to dismiss a notification (mark as read)
 */
export function useDismissNotification(): (
  notification: AppNotification
) => void {
  const { mutate: markAsRead } = useMarkAsRead()

  return useCallback(
    (notification: AppNotification) => {
      if (!notification?.id) {
        Logger.warn(
          '[useDismissNotification] notification or id is undefined:',
          notification
        )
        return
      }

      markAsRead(notification.id)
    },
    [markAsRead]
  )
}
