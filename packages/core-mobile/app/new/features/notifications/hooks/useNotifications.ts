import { useMemo, useCallback } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import Logger from 'utils/Logger'
import { useDeviceArn } from 'common/hooks/useDeviceArn'
import NotificationCenterService from '../services/NotificationCenterService'
import {
  AppNotification,
  BackendNotification,
  NotificationCategory,
  NotificationTab
} from '../types'
import { filterByTab } from '../utils'

// TODO: remove before merging — local dev mocks for notification UI verification
const MOCK_NOTIFICATIONS: BackendNotification[] = [
  {
    id: 'mock-price-alert-1',
    category: NotificationCategory.PRICE_UPDATE,
    type: 'PRICE_ALERTS',
    title: 'AVAX reached $35.00',
    body: 'Avalanche price alert triggered',
    // 2 hours ago
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    deepLinkUrl: 'https://core.app/token/avax',
    data: {
      tokenId: 'eip155:1-0x514910771af9ca656af840dff83e8264ecf986ca',
      tokenName: 'Avalanche',
      tokenSymbol: 'AVAX',
      currentPrice: 35.0,
      priceChangePercent: 5.23,
      url: 'https://core.app/token/avax'
    }
  },
  {
    id: 'mock-price-alert-2',
    category: NotificationCategory.PRICE_UPDATE,
    type: 'PRICE_ALERTS',
    title: 'BTC reached $95,000.00',
    body: 'Bitcoin price alert triggered',
    // 6 hours ago
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    data: {
      tokenId: 'eip155:1-0xbtc',
      tokenName: 'Bitcoin',
      tokenSymbol: 'BTC',
      currentPrice: 95000.0,
      priceChangePercent: -2.1,
      url: 'https://core.app/token/btc'
    }
  },
  {
    id: 'mock-balance-change-1',
    category: NotificationCategory.TRANSACTION,
    type: 'BALANCE_CHANGES',
    title: 'You received 10 USDC',
    body: 'A transfer was received on Ethereum',
    // 24 hours ago
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    data: {
      event: 'BALANCES_RECEIVED',
      chainId: 'eip155:1',
      chainName: 'Ethereum',
      transactionHash: '0xabc123',
      accountAddress: '0x1234567890abcdef',
      transfers: [
        { tokenSymbol: 'USDC', amount: '10.00', partnerAddress: '0xdeadbeef' }
      ],
      url: 'https://core.app/tx/0xabc123'
    }
  },
  {
    id: 'mock-balance-change-2',
    category: NotificationCategory.TRANSACTION,
    type: 'BALANCE_CHANGES',
    title: 'You sent 0.5 ETH',
    body: 'A transfer was sent on Ethereum',
    // 48 hours ago
    timestamp: Date.now() - 48 * 60 * 60 * 1000,
    data: {
      event: 'BALANCES_SPENT',
      chainId: 'eip155:1',
      chainName: 'Ethereum',
      transactionHash: '0xdef456',
      accountAddress: '0x1234567890abcdef',
      transfers: [
        { tokenSymbol: 'ETH', amount: '0.5', partnerAddress: '0xcafebabe' }
      ],
      url: 'https://core.app/tx/0xdef456'
    }
  }
]

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
    queryFn: async () => {
      const real = deviceArn
        ? await NotificationCenterService.fetchNotifications(deviceArn)
        : []
      return [...MOCK_NOTIFICATIONS, ...real]
    },
    enabled: true,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 1 // 1 minute
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
