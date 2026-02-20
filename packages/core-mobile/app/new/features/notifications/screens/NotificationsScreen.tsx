import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, SegmentedControl, Text, View } from '@avalabs/k2-alpine'
import { useWindowDimensions } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useSelector } from 'react-redux'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'
import { handleDeeplink } from 'contexts/DeeplinkContext/utils/handleDeeplink'
import { DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import {
  selectIsEarnBlocked,
  selectIsInAppDefiBorrowBlocked
} from 'store/posthog'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { LoadingState } from 'common/components/LoadingState'
import NotificationEmptyState from '../components/NotificationEmptyState'
import SwipeableRow from '../components/SwipeableRow'
import PriceAlertItem from '../components/PriceAlertItem'
import BalanceChangeItem from '../components/BalanceChangeItem'
import GenericNotificationItem from '../components/GenericNotificationItem'
import SwapActivityItem from '../components/SwapActivityItem'
import {
  useNotifications,
  useMarkAllAsRead,
  useDismissNotification,
  useUnreadCount
} from '../hooks/useNotifications'
import {
  AppNotification,
  NotificationTab,
  isPriceAlertNotification,
  isBalanceChangeNotification,
  SwapActivityItem as SwapActivityItemType
} from '../types'
import { useSwapActivitiesStore } from '../store'
import { isSwapDismissable } from '../utils'

const TITLE = 'Notifications'

const TAB_ITEMS = [
  { title: 'All', value: NotificationTab.ALL },
  { title: 'Transactions', value: NotificationTab.TRANSACTIONS },
  { title: 'Price updates', value: NotificationTab.PRICE_UPDATES }
]

const SWIPE_DELAY = 100 // ms between each swipe animation
const SWIPE_DURATION = 500 // animation duration for each swipe
const MAX_ANIMATED_ITEMS = 10 // only animate visible items, rest disappear instantly

/**
 * Check if notification is a price alert with metadata
 */
const isPriceAlertWithData = (notification: AppNotification): boolean => {
  if (!isPriceAlertNotification(notification)) return false
  return notification.data?.priceChangePercent !== undefined
}

/**
 * Check if notification is a balance change with metadata
 */
const isBalanceChangeWithData = (notification: AppNotification): boolean => {
  if (!isBalanceChangeNotification(notification)) return false
  const { transfers } = notification.data ?? {}
  return transfers !== undefined && transfers.length > 0
}

/**
 * Check if a notification has an actionable URL (not skipped like core://portfolio)
 */
const hasActionableUrl = (notification: AppNotification): boolean => {
  const url = notification.deepLinkUrl
  if (!url) return false

  try {
    const parsedUrl = new URL(url)
    const protocol = parsedUrl.protocol.replace(':', '')

    // Skip core://portfolio - it doesn't navigate anywhere useful
    return !(protocol === 'core' && parsedUrl.host === 'portfolio')
  } catch {
    return false
  }
}

const renderNotificationItem = (
  item: AppNotification,
  props: {
    showSeparator: boolean
    accessoryType: 'chevron' | 'none'
    testID: string
  }
): React.JSX.Element => {
  if (isPriceAlertWithData(item)) {
    return <PriceAlertItem notification={item} {...props} />
  }

  if (isBalanceChangeWithData(item)) {
    return <BalanceChangeItem notification={item} {...props} />
  }

  return <GenericNotificationItem notification={item} {...props} />
}

// TODO: depend on what we get from backend,
// we might need to check locally persisted swap item with the backend transaction
// to avoid duplication in the list. For now we assume they are separate and just sort by timestamp.
export const NotificationsScreen = (): JSX.Element => {
  const { removeSwapActivity, clearCompletedSwapActivities, swapActivities } =
    useSwapActivitiesStore()
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()
  const { openUrl } = useCoreBrowser()
  const isEarnBlocked = useSelector(selectIsEarnBlocked)
  const isInAppDefiBorrowBlocked = useSelector(selectIsInAppDefiBorrowBlocked)
  const selectedTabIndex = useSharedValue(0)
  const [selectedTabState, setSelectedTabState] = useState(0)
  const selectedTab = TAB_ITEMS[selectedTabState]?.value ?? NotificationTab.ALL
  const [isClearingAll, setIsClearingAll] = useState(false)

  const handleSelectSegment = useCallback(
    (index: number) => {
      selectedTabIndex.value = index
      setSelectedTabState(index)
    },
    [selectedTabIndex]
  )

  const { notifications, isLoading } = useNotifications(selectedTab)
  const totalUnreadCount = useUnreadCount()
  const { mutateAsync: markAllAsRead } = useMarkAllAsRead()
  const dismissNotification = useDismissNotification()
  const clearAllTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  useEffect(() => {
    return () => clearTimeout(clearAllTimerRef.current)
  }, [])

  const handleSwapActivityPress = useCallback((item: SwapActivityItemType) => {
    router.push({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/notifications/swapDetail',
      params: { id: item.transfer.id }
    })
  }, [])

  // Map notification transactionHash → notification for BALANCE_CHANGES items
  const notificationByTxHash = useMemo(() => {
    const map = new Map<string, AppNotification>()
    for (const n of notifications) {
      if (isBalanceChangeNotification(n) && n.data?.transactionHash) {
        map.set(n.data.transactionHash, n)
      }
    }
    return map
  }, [notifications])

  // Transfer IDs whose source txHash matches a backend notification (duplicates).
  const duplicateTransferIds = useMemo(
    () =>
      new Set(
        Object.values(swapActivities)
          .filter(s => {
            const txHash = s.transfer.source?.txHash
            return txHash !== undefined && notificationByTxHash.has(txHash)
          })
          .map(s => s.transfer.id)
      ),
    [swapActivities, notificationByTxHash]
  )

  // Side effect: remove duplicate swap entries from MMKV — the tx is confirmed
  // so it is no longer in progress and the backend notification supersedes it.
  useEffect(() => {
    duplicateTransferIds.forEach(transferId => removeSwapActivity(transferId))
  }, [duplicateTransferIds, removeSwapActivity])

  // Combined list sorted by timestamp desc. All items (swaps + notifications)
  // are ordered purely by recency — no special pinning for in_progress swaps.
  type CombinedItem =
    | { kind: 'swap'; item: SwapActivityItemType }
    | { kind: 'notification'; item: AppNotification }

  const combinedItems = useMemo((): CombinedItem[] => {
    const showSwaps =
      selectedTab === NotificationTab.ALL ||
      selectedTab === NotificationTab.TRANSACTIONS

    return [
      ...(showSwaps
        ? Object.values(swapActivities)
            // Exclude swaps that already have a matching backend notification
            .filter(s => {
              const txHash = s.transfer.source?.txHash
              return txHash === undefined || !notificationByTxHash.has(txHash)
            })
            .map((s): CombinedItem => ({ kind: 'swap', item: s }))
        : []),
      ...notifications.map(
        (n): CombinedItem => ({ kind: 'notification', item: n })
      )
    ].sort((a, b) => b.item.timestamp - a.item.timestamp)
  }, [swapActivities, notifications, selectedTab, notificationByTxHash])
  // ──────────────────────────────────────────────────────────────────────────

  // Items that "Clear All" will remove: backend notifications + completed swaps
  const clearableItems = useMemo(
    () =>
      combinedItems.filter(
        item =>
          item.kind === 'notification' ||
          (item.kind === 'swap' && isSwapDismissable(item.item))
      ),
    [combinedItems]
  )

  const handleClearAll = useCallback(() => {
    if (isClearingAll || clearableItems.length === 0) return

    setIsClearingAll(true)

    // Only animate visible items, rest disappear instantly when data clears
    const animatedCount = Math.min(clearableItems.length, MAX_ANIMATED_ITEMS)
    const totalTime = animatedCount * SWIPE_DELAY + SWIPE_DURATION
    clearAllTimerRef.current = setTimeout(() => {
      markAllAsRead()
      clearCompletedSwapActivities()
      setIsClearingAll(false)
    }, totalTime)
  }, [
    isClearingAll,
    clearableItems.length,
    markAllAsRead,
    clearCompletedSwapActivities
  ])

  // Full empty state: no backend notifications AND no swap activities
  const hasNoContentAtAll =
    totalUnreadCount === 0 && Object.keys(swapActivities).length === 0
  const isCurrentViewEmpty =
    combinedItems.length === 0 && !isClearingAll && !isLoading
  // Full empty state only when there is truly nothing to show
  const showFullEmptyState = isCurrentViewEmpty && hasNoContentAtAll
  // Filtered empty state when current tab view is empty but content exists elsewhere
  const showFilteredEmptyState = isCurrentViewEmpty && !hasNoContentAtAll

  const emptyStateHeight = screenHeight - insets.bottom - insets.top - 100

  const renderHeader = useCallback(() => {
    // Hide header only when there are no notifications at all or loading
    if (showFullEmptyState || isLoading) {
      return null
    }
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginTop: 8,
          marginBottom: 10
        }}>
        <Text variant="heading2">{TITLE}</Text>
        {!showFilteredEmptyState && (
          <Button type="secondary" size="small" onPress={handleClearAll}>
            Clear all
          </Button>
        )}
      </View>
    )
  }, [showFullEmptyState, showFilteredEmptyState, isLoading, handleClearAll])

  const handleNotificationPress = useCallback(
    (notification: AppNotification) => {
      const url = notification.deepLinkUrl
      if (url && hasActionableUrl(notification)) {
        router.dismiss()
        handleDeeplink({
          deeplink: {
            url,
            origin: DeepLinkOrigin.ORIGIN_NOTIFICATION
          },
          dispatch: action => action,
          isEarnBlocked,
          isInAppDefiBorrowBlocked,
          openUrl
        })
      }
    },
    [openUrl, isEarnBlocked, isInAppDefiBorrowBlocked]
  )

  const renderFooter = useCallback(() => {
    // Hide footer only when there are no notifications at all or loading
    if (showFullEmptyState || isLoading) {
      return null
    }
    return (
      <SegmentedControl
        items={TAB_ITEMS}
        selectedSegmentIndex={selectedTabIndex}
        onSelectSegment={handleSelectSegment}
        dynamicItemWidth={false}
      />
    )
  }, [selectedTabIndex, handleSelectSegment, showFullEmptyState, isLoading])

  const renderContent = (): React.JSX.Element => {
    if (isLoading) {
      return <LoadingState sx={{ height: emptyStateHeight }} />
    }

    // Full empty state - no notifications at all
    if (showFullEmptyState) {
      return (
        <View
          style={{
            height: emptyStateHeight,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <NotificationEmptyState />
        </View>
      )
    }

    // Filtered empty state - current tab is empty but other tabs have items
    if (showFilteredEmptyState) {
      return (
        <View
          style={{
            height: emptyStateHeight - 100,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <NotificationEmptyState />
        </View>
      )
    }

    return (
      <View>
        {combinedItems.map((combined, index) => {
          const isLast = index === combinedItems.length - 1

          if (combined.kind === 'swap') {
            const swap = combined.item
            const isDismissable = isSwapDismissable(swap)
            return (
              <SwipeableRow
                key={swap.transfer.id}
                animateOut={
                  isDismissable && isClearingAll && index < MAX_ANIMATED_ITEMS
                }
                animateDelay={index * SWIPE_DELAY}
                onSwipeComplete={() => removeSwapActivity(swap.transfer.id)}
                onPress={() => handleSwapActivityPress(swap)}
                enabled={!isClearingAll && isDismissable}>
                <SwapActivityItem
                  item={swap}
                  showSeparator={!isLast}
                  testID={`swap-activity-${swap.transfer.id}`}
                />
              </SwipeableRow>
            )
          }

          const notification = combined.item
          // Only animate first MAX_ANIMATED_ITEMS, rest disappear instantly
          const shouldAnimate = isClearingAll && index < MAX_ANIMATED_ITEMS
          return (
            <SwipeableRow
              key={notification.id}
              animateOut={shouldAnimate}
              animateDelay={index * SWIPE_DELAY}
              onSwipeComplete={() => dismissNotification(notification)}
              onPress={() => handleNotificationPress(notification)}
              enabled={!isClearingAll}>
              {renderNotificationItem(notification, {
                showSeparator: !isLast,
                accessoryType: hasActionableUrl(notification)
                  ? 'chevron'
                  : 'none',
                testID: `notification-item-${notification.id}`
              })}
            </SwipeableRow>
          )
        })}
      </View>
    )
  }

  return (
    <ScrollScreen
      isModal
      navigationTitle={TITLE}
      renderFooter={renderFooter}
      renderHeader={renderHeader}>
      {renderContent()}
    </ScrollScreen>
  )
}

export default NotificationsScreen
