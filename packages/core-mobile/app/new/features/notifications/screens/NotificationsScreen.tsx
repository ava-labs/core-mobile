import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, SegmentedControl, Text, View } from '@avalabs/k2-alpine'
import { useWindowDimensions } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'
import { handleDeeplink } from 'contexts/DeeplinkContext/utils/handleDeeplink'
import { DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import {
  selectIsEarnBlocked,
  selectIsInAppDefiBlocked,
  selectIsFusionEnabled,
  selectIsFusionAvalancheCctEnabled
} from 'store/posthog'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { ViewOnceKey, selectHasBeenViewedOnce } from 'store/viewOnce'
import {
  selectAccounts,
  selectActiveAccount,
  setActiveAccount
} from 'store/account'
import { selectWallets } from 'store/wallet/slice'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { StuckFundsBanner } from 'features/swap/components/StuckFundsBanner'
import { LoadingState } from 'common/components/LoadingState'
import { useFusionTransfers } from 'features/swap/hooks/useZustandStore'
import { FusionTransfer } from 'features/swap/types'
import StakeCompleteItem from '../components/StakeCompleteItem'
import {
  StakeCompleteNotificationItem,
  useStakeCompleteNotifications
} from '../hooks/useStakeCompleteNotifications'
import { useStakeCompleteNotificationRecords } from '../store/stakeCompleteNotificationRecords'
import NotificationEmptyState from '../components/NotificationEmptyState'
import SwipeableRow from '../components/SwipeableRow'
import PriceAlertItem from '../components/PriceAlertItem'
import BalanceChangeItem from '../components/BalanceChangeItem'
import RecurringSwapItem from '../components/RecurringSwapItem'
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
  isBalanceChangeNotification,
  isRecurringSwapNotification
} from '../types'
import {
  buildAccountLabelMap,
  isSwapTerminal,
  isTerminalRecurringSwapNotification
} from '../utils'
import { FusionTransferItem } from '../components/FusionTransferItem'

const TITLE = 'Notifications'

const TAB_ITEMS = [
  { title: 'All', value: NotificationTab.ALL },
  { title: 'Transactions', value: NotificationTab.TRANSACTIONS },
  { title: 'Price updates', value: NotificationTab.PRICE_UPDATES }
]

// Combined list sorted by timestamp desc. All items (swaps + notifications)
// are ordered purely by recency — no special pinning for in_progress swaps.
type CombinedItem =
  | { kind: 'swap'; item: FusionTransfer }
  | { kind: 'stake'; item: StakeCompleteNotificationItem }
  | { kind: 'notification'; item: AppNotification }

const SWIPE_DELAY = 100 // ms between each swipe animation
const SWIPE_DURATION = 500 // animation duration for each swipe
const MAX_ANIMATED_ITEMS = 10 // only animate visible items, rest disappear instantly

/**
 * Check if notification is a price alert with metadata.
 * Handles both direct PRICE_ALERTS type and NEWS-wrapped price alerts
 * (type:"NEWS" with data.event:"PRICE_ALERTS").
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
  // Terminal / last-leg recurring-swap notifications point at a schedule the
  // management screen no longer lists (it shows only Active / Paused), so the
  // row is non-actionable — no chevron, and the press handler no-ops.
  if (isTerminalRecurringSwapNotification(notification)) return false

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
    index: number
    testID: string
  },
  accountLabelMap: Map<string, string>
): React.JSX.Element => {
  if (isPriceAlertWithData(item)) {
    return <PriceAlertItem notification={item} {...props} />
  }

  if (isBalanceChangeWithData(item)) {
    const addr = isBalanceChangeNotification(item)
      ? item.data?.accountAddress?.toLowerCase()
      : undefined
    const accountLabel = addr ? accountLabelMap.get(addr) ?? null : null
    return (
      <BalanceChangeItem
        notification={item}
        accountLabel={accountLabel}
        {...props}
      />
    )
  }

  // RecurringSwap rows render even without a parsed `data` payload — the
  // backend-formatted title / body alone are enough for the user to read the
  // notification, and the deepLinkUrl still routes to the schedules screen.
  // (BalanceChange / PriceAlert require `data` for their formatted titles,
  // hence the `*WithData` predicates above; recurring-swap doesn't.)
  if (isRecurringSwapNotification(item)) {
    return <RecurringSwapItem notification={item} {...props} />
  }

  return <GenericNotificationItem notification={item} {...props} />
}

// Module-level row wrapper: keeps the swipe/press ternaries out of
// `renderItem`'s cognitive-complexity budget.
const StakeCompleteRow = ({
  stakeItem,
  index,
  isLast,
  isClearingAll,
  accounts,
  accountLabelMap,
  isDeveloperMode,
  onDismiss,
  onPress
}: {
  stakeItem: StakeCompleteNotificationItem
  index: number
  isLast: boolean
  isClearingAll: boolean
  accounts: ReturnType<typeof selectAccounts>
  accountLabelMap: Map<string, string>
  isDeveloperMode: boolean
  onDismiss: (items: StakeCompleteNotificationItem[]) => void
  onPress: (item: StakeCompleteNotificationItem) => void
}): React.JSX.Element => {
  const address = accounts[stakeItem.accountId]?.addressC?.toLowerCase()
  return (
    <SwipeableRow
      animateOut={isClearingAll && index < MAX_ANIMATED_ITEMS}
      animateDelay={index * SWIPE_DELAY}
      onSwipeComplete={() => onDismiss([stakeItem])}
      onPress={isClearingAll ? undefined : () => onPress(stakeItem)}
      enabled={!isClearingAll}>
      <StakeCompleteItem
        item={stakeItem}
        accountLabel={address ? accountLabelMap.get(address) ?? null : null}
        isDeveloperMode={isDeveloperMode}
        showSeparator={!isLast}
        testID={`stake-complete-${stakeItem.txHash}`}
      />
    </SwipeableRow>
  )
}

export const NotificationsScreen = (): JSX.Element => {
  const dispatch = useDispatch()
  const { removeTransfer, clearCompletedTransfers, transfers } =
    useFusionTransfers()
  const { items: stakeCompleteItems } = useStakeCompleteNotifications()
  const {
    remove: removeStakeNotificationRecords,
    removeFired: removeFiredStakeNotificationRecords
  } = useStakeCompleteNotificationRecords()
  const dismissStakeNotifications = useCallback(
    (items: StakeCompleteNotificationItem[]) =>
      removeStakeNotificationRecords(items.map(item => item.txHash)),
    [removeStakeNotificationRecords]
  )
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()
  const { openUrl } = useCoreBrowser()
  const isEarnBlocked = useSelector(selectIsEarnBlocked)
  const isInAppDefiBlocked = useSelector(selectIsInAppDefiBlocked)
  const isFusionEnabled = useSelector(selectIsFusionEnabled)
  const isFusionAvalancheCctEnabled = useSelector(
    selectIsFusionAvalancheCctEnabled
  )
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const hasSeenSwapOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.SWAP_ONBOARDING)
  )
  const accounts = useSelector(selectAccounts)
  const wallets = useSelector(selectWallets)
  const activeAccount = useSelector(selectActiveAccount)
  const accountLabelMap = useMemo(
    () => buildAccountLabelMap(accounts, wallets, activeAccount?.id),
    [accounts, wallets, activeAccount?.id]
  )
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

  const handleSwapActivityPress = useCallback((item: FusionTransfer) => {
    router.push({
      pathname: '/notifications/swapDetail',
      params: { id: item.transfer.id }
    })
  }, [])

  const combinedItems = useMemo((): CombinedItem[] => {
    const showSwaps =
      isFusionEnabled &&
      (selectedTab === NotificationTab.ALL ||
        selectedTab === NotificationTab.TRANSACTIONS)

    // Locally-derived stake-complete entries live in the same tabs as the
    // other transaction-shaped items. The hook itself gates on the earn flag.
    const showStakes =
      selectedTab === NotificationTab.ALL ||
      selectedTab === NotificationTab.TRANSACTIONS

    return [
      ...(showSwaps
        ? Object.values(transfers).map(
            (s): CombinedItem => ({ kind: 'swap', item: s })
          )
        : []),
      ...(showStakes
        ? stakeCompleteItems.map(
            (item): CombinedItem => ({ kind: 'stake', item })
          )
        : []),
      ...notifications.map(
        (n): CombinedItem => ({ kind: 'notification', item: n })
      )
    ].sort((a, b) => b.item.timestamp - a.item.timestamp)
  }, [
    isFusionEnabled,
    transfers,
    stakeCompleteItems,
    notifications,
    selectedTab
  ])
  // ──────────────────────────────────────────────────────────────────────────

  // Items that "Clear All" will remove: backend notifications + completed swaps
  const clearableItems = useMemo(
    () =>
      combinedItems.filter(
        item =>
          item.kind === 'notification' ||
          item.kind === 'stake' ||
          (item.kind === 'swap' && isSwapTerminal(item.item.transfer))
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
      if (isFusionEnabled) clearCompletedTransfers()
      if (stakeCompleteItems.length > 0) {
        // Every FIRED record, not just the rendered items — the visible list
        // is capped, so removing only those would let capped-out older items
        // surface right after clearing.
        removeFiredStakeNotificationRecords(Date.now())
      }
      setIsClearingAll(false)
    }, totalTime)
  }, [
    isClearingAll,
    clearableItems.length,
    markAllAsRead,
    isFusionEnabled,
    clearCompletedTransfers,
    stakeCompleteItems.length,
    removeFiredStakeNotificationRecords
  ])

  // Full empty state: no backend notifications AND no swap activities
  const hasNoContentAtAll =
    totalUnreadCount === 0 &&
    stakeCompleteItems.length === 0 &&
    (!isFusionEnabled || Object.keys(transfers).length === 0)
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
        {!showFilteredEmptyState && clearableItems.length > 0 && (
          <Button type="secondary" size="small" onPress={handleClearAll}>
            Clear all
          </Button>
        )}
      </View>
    )
  }, [
    showFullEmptyState,
    showFilteredEmptyState,
    isLoading,
    handleClearAll,
    clearableItems.length
  ])

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
          isInAppDefiBlocked,
          shouldRedirectStakeCompleteToCct:
            isFusionEnabled && isFusionAvalancheCctEnabled,
          isDeveloperMode,
          shouldShowSwapOnboarding: !hasSeenSwapOnboarding,
          openUrl
        })
      }
    },
    [
      openUrl,
      isEarnBlocked,
      isInAppDefiBlocked,
      isFusionEnabled,
      isFusionAvalancheCctEnabled,
      isDeveloperMode,
      hasSeenSwapOnboarding
    ]
  )

  // Mirrors the push-notification tap semantics
  // (`handleProcessNotificationData`): stake-complete pushes carry the
  // scheduling environment and an accountId, and tapping them switches
  // both BEFORE navigating. The center's rows do the same — the item list
  // spans both environments (the underlying service feeds the cross-mode
  // push scheduler), so without the mode switch a testnet stake tapped
  // from mainnet lands on a stake detail that can never resolve.
  const handleStakeCompletePress = useCallback(
    (item: StakeCompleteNotificationItem) => {
      if (item.isDeveloperMode !== isDeveloperMode) {
        dispatch(toggleDeveloperMode())
      }
      if (activeAccount?.id !== item.accountId) {
        dispatch(setActiveAccount(item.accountId))
      }
      router.dismiss()
      router.navigate({
        // @ts-ignore route is defined under (modals)/stakeDetail
        pathname: '/stakeDetail',
        params: { txHash: item.txHash, source: 'deeplink' }
      })
    },
    [activeAccount?.id, isDeveloperMode, dispatch]
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

  const keyExtractor = useCallback((combined: CombinedItem) => {
    if (combined.kind === 'swap') return `swap-${combined.item.transfer.id}`
    if (combined.kind === 'stake') return `stake-${combined.item.txHash}`
    return `notification-${combined.item.id}`
  }, [])

  const renderItem = useCallback(
    ({ item: combined, index }: { item: CombinedItem; index: number }) => {
      const isLast = index === combinedItems.length - 1

      if (combined.kind === 'swap') {
        const transfer = combined.item
        const isTerminal = isSwapTerminal(transfer.transfer)
        return (
          <SwipeableRow
            animateOut={
              isTerminal && isClearingAll && index < MAX_ANIMATED_ITEMS
            }
            animateDelay={index * SWIPE_DELAY}
            onSwipeComplete={() => removeTransfer(transfer.transfer.id)}
            onPress={
              isClearingAll
                ? undefined
                : () => handleSwapActivityPress(transfer)
            }
            enabled={!isClearingAll && isTerminal}>
            <FusionTransferItem
              item={transfer}
              showSeparator={!isLast}
              testID={`swap-activity-${transfer.transfer.id}`}
            />
          </SwipeableRow>
        )
      }

      if (combined.kind === 'stake') {
        return (
          <StakeCompleteRow
            stakeItem={combined.item}
            index={index}
            isLast={isLast}
            isClearingAll={isClearingAll}
            accounts={accounts}
            accountLabelMap={accountLabelMap}
            isDeveloperMode={isDeveloperMode}
            onDismiss={dismissStakeNotifications}
            onPress={handleStakeCompletePress}
          />
        )
      }

      const notification = combined.item
      const shouldAnimate = isClearingAll && index < MAX_ANIMATED_ITEMS
      return (
        <SwipeableRow
          animateOut={shouldAnimate}
          animateDelay={index * SWIPE_DELAY}
          onSwipeComplete={() => dismissNotification(notification)}
          onPress={
            isClearingAll
              ? undefined
              : () => handleNotificationPress(notification)
          }
          enabled={!isClearingAll}>
          {renderNotificationItem(
            notification,
            {
              showSeparator: !isLast,
              accessoryType: hasActionableUrl(notification)
                ? 'chevron'
                : 'none',
              index,
              testID: `notification-item-${notification.id}`
            },
            accountLabelMap
          )}
        </SwipeableRow>
      )
    },
    [
      combinedItems.length,
      isClearingAll,
      removeTransfer,
      handleSwapActivityPress,
      dismissNotification,
      handleNotificationPress,
      dismissStakeNotifications,
      handleStakeCompletePress,
      accounts,
      accountLabelMap,
      isDeveloperMode
    ]
  )

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
      <FlatList
        data={combinedItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        scrollEnabled={false}
      />
    )
  }

  return (
    <ScrollScreen
      isModal
      navigationTitle={TITLE}
      renderFooter={renderFooter}
      renderHeader={renderHeader}>
      {/* Stuck-funds banner — stranded cross-chain AVAX. Self-hides (and
          reserves no space) when none. */}
      <StuckFundsBanner
        sx={{ marginHorizontal: 16, marginTop: 15, marginBottom: 10 }}
      />
      {renderContent()}
    </ScrollScreen>
  )
}

export default NotificationsScreen
