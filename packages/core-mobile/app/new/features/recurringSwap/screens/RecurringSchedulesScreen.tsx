import React, { useCallback, useMemo, useState } from 'react'
import { Pressable } from 'react-native'
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import {
  ActivityIndicator,
  Button,
  GroupList,
  GroupListItem,
  Icons,
  showAlert,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { RECURRING_UNLIMITED_ORDERS_SENTINEL } from '@avalabs/fusion-sdk'
import type { Network } from '@avalabs/core-chains-sdk'
import type { NetworkContractToken } from '@avalabs/vm-module-types'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { LogoWithNetwork } from 'common/components/LogoWithNetwork'
import { useNetworkContractTokens } from 'hooks/networks/useNetworkContractTokens'
import { useNetworks } from 'hooks/networks/useNetworks'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network/slice'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { formatTokenAmount } from 'utils/Utils'
import Logger from 'utils/Logger'
import { showSnackbar } from 'common/utils/toast'
import { toChain } from 'features/swap/utils/fusionTypeConverters'
import { useRecurringSchedules } from '../hooks/useRecurringSchedules'
import { useCancelRecurringSchedule } from '../hooks/useCancelRecurringSchedule'
import { usePauseRecurringSchedule } from '../hooks/usePauseRecurringSchedule'
import { useUnpauseRecurringSchedule } from '../hooks/useUnpauseRecurringSchedule'
import { formatFrequencyShort } from '../utils/formatFrequency'
import {
  useIsCancelPending,
  useIsPausePending,
  useIsUnpausePending
} from '../store/pendingActionStore'
import {
  NATIVE_TOKEN_ADDRESS,
  RecurringOrderStatus,
  type RecurringOrder
} from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatUnixDateParts(ts: number): { date: string; time: string } {
  const d = new Date(ts * 1000)
  const date = d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  return { date, time }
}

function shortenAddress(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

type ResolvedToken = {
  symbol: string
  decimals: number
  logoUri?: string
}

// Markr returns `tokenIn`/`tokenOut` as raw EVM addresses with no symbol /
// decimals / logoUri. Join against the active network's token list (plus the
// network's native token, since the zero address represents AVAX / ETH) so the
// card can render real logos and a decimals-aware amount.
function resolveTokenInfo(
  address: string,
  network: Network | undefined,
  contractTokens: readonly NetworkContractToken[]
): ResolvedToken {
  const isNative = address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
  if (isNative && network) {
    return {
      symbol: network.networkToken.symbol,
      decimals: network.networkToken.decimals,
      logoUri: network.networkToken.logoUri
    }
  }
  const lower = address.toLowerCase()
  const match = contractTokens.find(t => t.address.toLowerCase() === lower)
  if (match) {
    const decimals =
      'decimals' in match && typeof match.decimals === 'number'
        ? match.decimals
        : 18
    return {
      symbol: match.symbol ?? shortenAddress(address),
      decimals,
      logoUri: match.logoUri
    }
  }
  return { symbol: shortenAddress(address), decimals: 18 }
}

function formatSummary(
  s: RecurringOrder,
  fromToken: ResolvedToken,
  toToken: ResolvedToken
): string {
  const cadence = formatFrequencyShort(s.frequency)
  const amount = formatTokenAmount(bigintToBig(s.amount, fromToken.decimals))
  const ordersClause =
    s.numberOfOrders === RECURRING_UNLIMITED_ORDERS_SENTINEL
      ? 'for ∞ orders'
      : s.numberOfOrders === 1
      ? 'for 1 order'
      : `for ${s.numberOfOrders} orders`
  return `${amount} ${fromToken.symbol} swapped for ${toToken.symbol} every ${cadence}, ${ordersClause}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: single schedule card
// ─────────────────────────────────────────────────────────────────────────────

// Handlers receive the schedule plus the resolved token symbols so the
// parent can pass them into the recurring-action side channel — that's
// what drives the `<RecurrenceDetails />` preview block on the in-app
// approval modal (`RecurringSwap/services/activeActionContext.ts`).
type ScheduleAction = (
  s: RecurringOrder,
  fromToken: ResolvedToken,
  toToken: ResolvedToken
) => void

type ScheduleCardProps = {
  schedule: RecurringOrder
  network: Network | undefined
  contractTokens: readonly NetworkContractToken[]
  onRemove: ScheduleAction
  onPause: ScheduleAction
  onUnpause: ScheduleAction
}

function ScheduleCard({
  schedule: s,
  network,
  contractTokens,
  onRemove,
  onPause,
  onUnpause
}: ScheduleCardProps): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()
  const isUnlimited = s.numberOfOrders === RECURRING_UNLIMITED_ORDERS_SENTINEL
  const isCancelling = useIsCancelPending(s.orderId)
  const isPausing = useIsPausePending(s.orderId)
  const isUnpausing = useIsUnpausePending(s.orderId)

  const isPaused = s.status === RecurringOrderStatus.Paused
  const isActive = s.status === RecurringOrderStatus.Active
  // Cancel is allowed by Markr only while the schedule is `active` or
  // `paused` — `completed` / `cancelled` orders 400 at preview time. Gate
  // the button at the UI boundary so tapping a finished row doesn't
  // surface a confusing toast.
  const canCancel = isActive || isPaused
  // Pause needs the schedule to be active AND no pause/unpause already in
  // flight; Unpause is the mirror condition for a paused schedule.
  const canPause = isActive && !isPausing && !isCancelling
  const canUnpause = isPaused && !isUnpausing && !isCancelling
  // While unpausing/pausing is mid-flight the cancel button is disabled to
  // prevent racing two on-chain TXs that mutate the same order.
  const cancelDisabled = isCancelling || isPausing || isUnpausing || !canCancel

  const [expanded, setExpanded] = useState(false)
  const chevronProgress = useSharedValue(0)

  const handleToggle = useCallback(() => {
    setExpanded(prev => {
      const next = !prev
      chevronProgress.value = withTiming(next ? 1 : 0, { duration: 200 })
      return next
    })
  }, [chevronProgress])

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronProgress.value * 180}deg` }]
  }))

  const fromToken = useMemo(
    () => resolveTokenInfo(s.tokenIn, network, contractTokens),
    [s.tokenIn, network, contractTokens]
  )
  const toToken = useMemo(
    () => resolveTokenInfo(s.tokenOut, network, contractTokens),
    [s.tokenOut, network, contractTokens]
  )

  const nextSwapValue = useMemo<React.ReactNode>(() => {
    if (s.nextExecutionAt === null || s.nextExecutionAt === undefined) {
      return '—'
    }
    const { date, time } = formatUnixDateParts(s.nextExecutionAt)
    return (
      <View sx={{ alignItems: 'flex-end' }}>
        <Text variant="body1" sx={{ color: '$textSecondary' }}>
          {date}
        </Text>
        <Text variant="body1" sx={{ color: '$textSecondary' }}>
          {time}
        </Text>
      </View>
    )
  }, [s.nextExecutionAt])

  const groupData = useMemo((): GroupListItem[] => {
    const totalLabel = isUnlimited ? '∞' : String(s.numberOfOrders)
    const items: GroupListItem[] = [
      {
        title: 'Orders executed',
        value: `${s.executedOrders} of ${totalLabel} swaps`
      },
      {
        title: 'Next swap scheduled',
        value: nextSwapValue
      }
    ]
    if (s.failures.length > 0) {
      items.push({
        title: 'Failed attempts',
        value: String(s.failures.length)
      })
    }
    return items
  }, [
    s.executedOrders,
    s.numberOfOrders,
    s.failures.length,
    isUnlimited,
    nextSwapValue
  ])

  return (
    <Animated.View
      layout={LinearTransition.easing(Easing.inOut(Easing.ease))}
      style={{
        backgroundColor: colors.$surfaceSecondary,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
        overflow: 'hidden'
      }}>
      <Pressable onPress={handleToggle}>
        <View
          sx={{
            position: 'relative',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            minHeight: 40
          }}>
          {network && (
            <LogoWithNetwork
              token={{
                symbol: fromToken.symbol,
                logoUri: fromToken.logoUri,
                chainId: s.chainId
              }}
              network={network}
              size="medium"
              outerBorderColor={colors.$surfaceSecondary}
            />
          )}
          <Icons.Custom.Compare
            width={20}
            height={20}
            color={colors.$textPrimary}
          />
          {network && (
            <LogoWithNetwork
              token={{
                symbol: toToken.symbol,
                logoUri: toToken.logoUri,
                chainId: s.chainId
              }}
              network={network}
              size="medium"
              outerBorderColor={colors.$surfaceSecondary}
            />
          )}
          <Animated.View
            style={[{ position: 'absolute', right: 0 }, chevronStyle]}>
            <Icons.Navigation.ExpandMore
              width={24}
              height={24}
              color={colors.$textSecondary}
            />
          </Animated.View>
        </View>

        <Text
          variant="body2"
          sx={{
            color: '$textPrimary',
            textAlign: 'center',
            marginTop: 12
          }}>
          {formatSummary(s, fromToken, toToken)}
        </Text>
      </Pressable>

      {expanded && (
        <View sx={{ marginTop: 12, gap: 12 }}>
          {/* Pause / Unpause sits to the LEFT of Cancel. The
              button's label, spinner state, and action depend on whether
              the schedule is currently active or paused: while paused, it
              acts as Unpause; while active, it acts as Pause. The intent
              after the on-chain TX confirms is reflected by the server
              `status` flip and the pending-action store clearing. */}
          <View sx={{ flexDirection: 'row', gap: 12 }}>
            {isPaused ? (
              <Button
                type="secondary"
                size="medium"
                style={{ flex: 1 }}
                disabled={!canUnpause}
                leftIcon={
                  isUnpausing ? (
                    <ActivityIndicator
                      size="small"
                      style={{ marginRight: 4 }}
                    />
                  ) : undefined
                }
                onPress={() => onUnpause(s, fromToken, toToken)}>
                {isUnpausing ? 'Unpausing' : 'Unpause'}
              </Button>
            ) : (
              <Button
                type="secondary"
                size="medium"
                style={{ flex: 1 }}
                disabled={!canPause}
                leftIcon={
                  isPausing ? (
                    <ActivityIndicator
                      size="small"
                      style={{ marginRight: 4 }}
                    />
                  ) : undefined
                }
                onPress={() => onPause(s, fromToken, toToken)}>
                {isPausing ? 'Pausing' : 'Pause'}
              </Button>
            )}
            <Button
              type="secondary"
              size="medium"
              style={{ flex: 1 }}
              textStyle={{ color: colors.$textDanger }}
              disabled={cancelDisabled}
              leftIcon={
                isCancelling ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.$textDanger}
                    style={{ marginRight: 4 }}
                  />
                ) : undefined
              }
              onPress={() => onRemove(s, fromToken, toToken)}>
              {isCancelling ? 'Cancelling' : 'Cancel'}
            </Button>
          </View>

          <GroupList
            data={groupData}
            separatorMarginRight={16}
            titleSx={{
              fontFamily: 'Inter-Regular'
            }}
          />
        </View>
      )}
    </Animated.View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export function RecurringSchedulesScreen(): JSX.Element {
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const chainId = activeNetwork?.chainId

  const { data: schedules, isLoading } = useRecurringSchedules(
    activeAccount?.addressC,
    chainId
  )
  const contractTokens = useNetworkContractTokens(activeNetwork)

  const cancel = useCancelRecurringSchedule()
  const pause = usePauseRecurringSchedule()
  const unpause = useUnpauseRecurringSchedule()
  const { getNetwork } = useNetworks()

  // Include both Active and Paused — a paused schedule is still user-
  // manageable (Unpause + Cancel) and should remain visible in the
  // management screen. `cancelled` / `completed` orders are hidden.
  //
  // Sort: newest createdAt first. Markr's `createdAt` is seconds-resolution,
  // so back-to-back schedules can tie — fall back to reverse server-order
  // (Markr's listOrders appends new schedules, so a later input index ≈
  // created later within the same second). Without this tie-break a stable
  // sort would leave the older sibling on top.
  const manageableSchedules = useMemo(() => {
    const filtered = (schedules ?? [])
      .filter(
        s =>
          s.status === RecurringOrderStatus.Active ||
          s.status === RecurringOrderStatus.Paused
      )
      .map((s, idx) => ({ s, idx }))
    filtered.sort((a, b) => {
      const delta = b.s.createdAt - a.s.createdAt
      if (delta !== 0) return delta
      return b.idx - a.idx
    })
    return filtered.map(({ s }) => s)
  }, [schedules])
  const manageableCount = manageableSchedules.length

  // Resolve the schedule's source `Chain` (CAIP-2 chainId + rpcUrl +
  // multicall) from the Redux network state. The SDK's `execute*` methods
  // need a full `Chain` rather than a numeric chainId so they can run the
  // gas-estimate / allowance reads against `chain.rpcUrl`.
  const buildSourceChain = useCallback(
    (s: RecurringOrder) => {
      const network = getNetwork(s.chainId)
      if (!network) return undefined
      try {
        return toChain(network)
      } catch (err) {
        Logger.error('[RecurringSwap] toChain failed', err)
        return undefined
      }
    },
    [getNetwork]
  )

  const handleRemove = useCallback(
    (s: RecurringOrder, fromToken: ResolvedToken, toToken: ResolvedToken) => {
      const sourceChain = buildSourceChain(s)
      if (!sourceChain) {
        showSnackbar('Network not available — try again')
        return
      }
      showAlert({
        title: 'Are you sure you want to cancel this recurring swap?',
        description:
          'Scheduled swaps may still execute while this action is confirmed.',
        buttons: [
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              // Cancel is on-chain. The SDK signs and
              // broadcasts internally via the evmSigner already wired into
              // FusionService; that signer dispatches through
              // ApprovalController so the user sees Core's in-app approval
              // modal. Analytics + cache invalidation fire from the hook
              // on broadcast resolution. Symbols thread through to the
              // recurring-action side channel for the modal's preview block.
              cancel.mutate({
                orderId: s.orderId,
                address: s.owner,
                sourceChain,
                chainId: s.chainId,
                fromTokenSymbol: fromToken.symbol,
                toTokenSymbol: toToken.symbol
              })
            }
          },
          {
            text: 'Cancel',
            style: 'default'
          }
        ]
      })
    },
    [cancel, buildSourceChain]
  )

  // Pause / Unpause are non-destructive — no confirmation dialog. The hook
  // surfaces error toasts on Markr 400/404 (already paused, completed, etc.)
  // and the approval modal lets the user back out before signing.
  const handlePause = useCallback(
    (s: RecurringOrder, fromToken: ResolvedToken, toToken: ResolvedToken) => {
      const sourceChain = buildSourceChain(s)
      if (!sourceChain) {
        showSnackbar('Network not available — try again')
        return
      }
      pause.mutate({
        orderId: s.orderId,
        address: s.owner,
        sourceChain,
        chainId: s.chainId,
        fromTokenSymbol: fromToken.symbol,
        toTokenSymbol: toToken.symbol
      })
    },
    [pause, buildSourceChain]
  )

  const handleUnpause = useCallback(
    (s: RecurringOrder, fromToken: ResolvedToken, toToken: ResolvedToken) => {
      const sourceChain = buildSourceChain(s)
      if (!sourceChain) {
        showSnackbar('Network not available — try again')
        return
      }
      unpause.mutate({
        orderId: s.orderId,
        address: s.owner,
        sourceChain,
        chainId: s.chainId,
        fromTokenSymbol: fromToken.symbol,
        toTokenSymbol: toToken.symbol
      })
    },
    [unpause, buildSourceChain]
  )

  const swapWord = `swap${manageableCount === 1 ? '' : 's'}`
  // Force the screen header to break after "{N} recurring" so "swaps scheduled"
  // always sits on a second line, regardless of the count's width.
  const title = `${manageableCount} recurring\n${swapWord} scheduled`
  const navigationTitle = `${manageableCount} recurring ${swapWord} scheduled`

  return (
    <ScrollScreen
      title={title}
      navigationTitle={navigationTitle}
      isModal
      contentContainerStyle={{ padding: 16 }}>
      {isLoading && (
        <View sx={{ alignItems: 'center', paddingTop: 32 }}>
          <Text variant="body2" sx={{ color: '$textSecondary' }}>
            Loading…
          </Text>
        </View>
      )}
      {!isLoading && manageableSchedules.length === 0 && (
        <View sx={{ alignItems: 'center', paddingTop: 32 }}>
          <Text variant="body2" sx={{ color: '$textSecondary' }}>
            No recurring swaps found.
          </Text>
        </View>
      )}
      {manageableSchedules.map(s => (
        <ScheduleCard
          key={s.orderId}
          schedule={s}
          network={activeNetwork}
          contractTokens={contractTokens}
          onRemove={handleRemove}
          onPause={handlePause}
          onUnpause={handleUnpause}
        />
      ))}
    </ScrollScreen>
  )
}
