import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, SegmentedControl, Text, View } from '@avalabs/k2-alpine'
import { useWindowDimensions } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'
import { handleDeeplink } from 'contexts/DeeplinkContext/utils/handleDeeplink'
import { DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { LoadingState } from 'common/components/LoadingState'
import NotificationEmptyState from '../components/NotificationEmptyState'
import SwipeableRow from '../components/SwipeableRow'
import PriceAlertItem from '../components/PriceAlertItem'
import BalanceChangeItem from '../components/BalanceChangeItem'
import GenericNotificationItem from '../components/GenericNotificationItem'
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
  isBalanceChangeNotification
} from '../types'

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

export const NotificationsScreen = (): JSX.Element => {
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()
  const { openUrl } = useCoreBrowser()
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

  const handleClearAll = useCallback(() => {
    if (isClearingAll || notifications.length === 0) return

    setIsClearingAll(true)

    // Only animate visible items, rest disappear instantly when data clears
    const animatedCount = Math.min(notifications.length, MAX_ANIMATED_ITEMS)
    const totalTime = animatedCount * SWIPE_DELAY + SWIPE_DURATION
    clearAllTimerRef.current = setTimeout(() => {
      markAllAsRead()
      setIsClearingAll(false)
    }, totalTime)
  }, [isClearingAll, notifications, markAllAsRead])

  // Differentiate between "no notifications at all" vs "current tab empty but other tabs have items"
  const hasNoNotificationsAtAll = totalUnreadCount === 0
  const isCurrentTabEmpty =
    notifications.length === 0 && !isClearingAll && !isLoading
  // Full empty state only when there are no notifications at all
  const showFullEmptyState = isCurrentTabEmpty && hasNoNotificationsAtAll
  // Filtered empty state when current tab is empty but other tabs have items
  const showFilteredEmptyState = isCurrentTabEmpty && !hasNoNotificationsAtAll

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
        <Text variant="heading2">Notifications</Text>
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
          isEarnBlocked: false,
          openUrl
        })
      }
    },
    [openUrl]
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

  const renderContent = () => {
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
        {notifications.map((item, index) => {
          const isLast = index === notifications.length - 1
          // Only animate first MAX_ANIMATED_ITEMS, rest disappear instantly
          const shouldAnimate = isClearingAll && index < MAX_ANIMATED_ITEMS
          return (
            <SwipeableRow
              key={item.id}
              animateOut={shouldAnimate}
              animateDelay={index * SWIPE_DELAY}
              onSwipeComplete={() => dismissNotification(item)}
              onPress={() => handleNotificationPress(item)}
              enabled={!isClearingAll}>
              {renderNotificationItem(item, {
                showSeparator: !isLast,
                accessoryType: hasActionableUrl(item) ? 'chevron' : 'none',
                testID: `notification-item-${item.id}`
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
      renderFooter={renderFooter}
      renderHeader={renderHeader}>
      {renderContent()}
    </ScrollScreen>
  )
}

export default NotificationsScreen
