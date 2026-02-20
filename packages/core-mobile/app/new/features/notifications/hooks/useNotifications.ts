import { useMemo, useCallback, useState, useEffect } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
  UseQueryResult
} from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { StorageKey } from 'resources/Constants'
import { commonStorage } from 'utils/mmkv'
import Logger from 'utils/Logger'
import NotificationCenterService from '../services/NotificationCenterService'
import { AppNotification, BackendNotification, NotificationTab } from '../types'
import { filterByTab } from '../utils'

/**
 * Hook to get deviceArn from MMKV storage.
 * Subscribes to storage changes so the value updates reactively
 * when registerDeviceToNotificationSender writes the ARN.
 */
export function useDeviceArn(): string | undefined {
  const [deviceArn, setDeviceArn] = useState<string | undefined>(() =>
    commonStorage.getString(StorageKey.NOTIFICATIONS_OPTIMIZATION)
  )

  useEffect(() => {
    const listener = commonStorage.addOnValueChangedListener(changedKey => {
      if (changedKey === StorageKey.NOTIFICATIONS_OPTIMIZATION) {
        setDeviceArn(
          commonStorage.getString(StorageKey.NOTIFICATIONS_OPTIMIZATION)
        )
      }
    })
    return () => listener.remove()
  }, [])

  return deviceArn
}

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
    queryFn: () =>
      deviceArn
        ? NotificationCenterService.fetchNotifications(deviceArn)
        : Promise.resolve([]),
    enabled: !!deviceArn,
    staleTime: 1000 * 60 * 1 // 1 minute
  })
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

  const notifications = useMemo(() => {
    const sorted: AppNotification[] = [...(backendNotifications ?? [])].sort(
      (a, b) => b.timestamp - a.timestamp
    )

    return filterByTab(sorted, tab)
  }, [backendNotifications, tab])

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

  return backendNotifications?.length ?? 0
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
  {
    previousData: BackendNotification[] | undefined
  }
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
