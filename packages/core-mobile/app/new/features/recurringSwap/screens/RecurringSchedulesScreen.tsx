import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
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
  SplitButton,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import {
  ERC_ZERO_ADDRESS,
  RECURRING_UNLIMITED_ORDERS_SENTINEL
} from '@avalabs/fusion-sdk'
import type { Network } from '@avalabs/core-chains-sdk'
import type { NetworkContractToken } from '@avalabs/vm-module-types'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { LogoWithNetwork } from 'common/components/LogoWithNetwork'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
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
import type { UseRecurringOrderAction } from '../hooks/_makeOrderActionHook'
import { useCancelRecurringSchedule } from '../hooks/useCancelRecurringSchedule'
import { usePauseRecurringSchedule } from '../hooks/usePauseRecurringSchedule'
import { useResumeRecurringSchedule } from '../hooks/useResumeRecurringSchedule'
import { formatFrequencyShort } from '../utils/formatFrequency'
import { shouldShowDeepLinkNotFound } from '../utils/shouldShowDeepLinkNotFound'
import {
  useIsCancelPending,
  useIsPausePending,
  useIsResumePending
} from '../store/pendingActionStore'
import { RecurringOrderStatus, type RecurringOrder } from '../types'

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
  // `null` when the token can't be matched against the active network's
  // catalog (un-indexed / removed token). Callers must render a placeholder
  // — defaulting to 18 here would silently format e.g. a 6-decimal USDC
  // order (`1_000_000n`) as ~0 in the summary.
  decimals: number | null
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
  const isNative = address.toLowerCase() === ERC_ZERO_ADDRESS.toLowerCase()
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
        : null
    return {
      symbol: match.symbol ?? shortenAddress(address),
      decimals,
      logoUri: match.logoUri
    }
  }
  return { symbol: shortenAddress(address), decimals: null }
}

function formatSummary(
  s: RecurringOrder,
  fromToken: ResolvedToken,
  toToken: ResolvedToken
): string {
  const cadence = formatFrequencyShort(s.frequency)
  // Default 2 max-fraction digits matches the rest of the app's
  // `formatTokenAmount` usage. The 2nd-arg override would let some
  // 18-decimal tokens render up to 18 fractional digits; we keep this
  // preview in lock-step with send/swap previews instead.
  //
  // If the token isn't in the active network's catalog
  // (`resolveTokenInfo` returns `decimals: null`), we'd otherwise lie
  // about the amount — render an em-dash placeholder so the row remains
  // useful (symbol + cadence + orders) without misrepresenting the size.
  const amount =
    fromToken.decimals === null
      ? '—'
      : formatTokenAmount(bigintToBig(s.amount, fromToken.decimals))
  const ordersClause =
    s.numberOfOrders === RECURRING_UNLIMITED_ORDERS_SENTINEL
      ? 'for ∞ orders'
      : s.numberOfOrders === 1
      ? 'for 1 order'
      : `for ${s.numberOfOrders} orders`
  return `${amount} ${fromToken.symbol} swapped for ${toToken.symbol}\nevery ${cadence}, ${ordersClause}`
}

// Non-`Active` statuses surface as a muted badge under the summary. `Active`
// is the default running state so it has no badge. Markr's wire values are
// lowercase (`paused` / `cancelled` / `completed`); render them title-cased.
const STATUS_LABEL: Partial<Record<RecurringOrderStatus, string>> = {
  [RecurringOrderStatus.Paused]: 'Paused',
  [RecurringOrderStatus.Cancelled]: 'Cancelled',
  [RecurringOrderStatus.Completed]: 'Completed'
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: single schedule card
// ─────────────────────────────────────────────────────────────────────────────

// Handlers receive the schedule plus the resolved token symbols so the
// parent can forward them through the SDK's `signerContext` field —
// that's what drives the `<RecurrenceDetails />` preview block on the
// in-app approval modal (`RecurringSwap/services/recurringSignerContext.ts`).
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
  onResume: ScheduleAction
  /** False when the schedule's source chain can't be resolved (network
   *  removed from the user's list, `toChain` failed). All action buttons
   *  are disabled in that case — handlers would only surface a snackbar. */
  isSourceChainAvailable: boolean
  /** Hook-level pending flags (any row's cancel/pause/resume in flight
   *  on this screen). Closes the double-tap window between the confirm
   *  alert dismissing and the per-row store entry flipping after broadcast. */
  cancelInFlight: boolean
  pauseInFlight: boolean
  resumeInFlight: boolean
  /** Seeds the card in the expanded state on mount. Set when the screen
   *  is deep-linked to a specific orderId (notification → schedules) so
   *  the matching card opens automatically. */
  initialExpanded?: boolean
  /** Reports the card's y-offset within the scroll content as soon as it
   *  lays out. The screen uses this to scroll the deep-linked card into
   *  view when it would otherwise be off-screen. */
  onMeasureY?: (y: number) => void
}

function ScheduleCard({
  schedule: s,
  network,
  contractTokens,
  onRemove,
  onPause,
  onResume,
  isSourceChainAvailable,
  cancelInFlight,
  pauseInFlight,
  resumeInFlight,
  initialExpanded = false,
  onMeasureY
}: ScheduleCardProps): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()
  const isUnlimited = s.numberOfOrders === RECURRING_UNLIMITED_ORDERS_SENTINEL
  const isCancelling = useIsCancelPending(s.orderId)
  const isPausing = useIsPausePending(s.orderId)
  const isResuming = useIsResumePending(s.orderId)

  const isPaused = s.status === RecurringOrderStatus.Paused
  const isActive = s.status === RecurringOrderStatus.Active
  // Cancel is allowed by Markr only while the schedule is `active` or
  // `paused` — `completed` / `cancelled` orders 400 at preview time. Gate
  // the button at the UI boundary so tapping a finished row doesn't
  // surface a confusing toast.
  const canCancel = isActive || isPaused
  // Pause needs the schedule to be active AND no pause/resume already in
  // flight (per-row from the store, or screen-wide from the hook); Resume
  // is the mirror condition for a paused schedule. The hook-level
  // `*InFlight` flags cover the brief window between the user confirming
  // the native alert and the per-row entry being added in
  // `pendingActionStore` after broadcast resolves.
  const canPause =
    isActive && !isPausing && !isCancelling && !pauseInFlight && !cancelInFlight
  const canResume =
    isPaused &&
    !isResuming &&
    !isCancelling &&
    !resumeInFlight &&
    !cancelInFlight
  // While unpausing/pausing is mid-flight the cancel button is disabled to
  // prevent racing two on-chain TXs that mutate the same order.
  const cancelDisabled =
    isCancelling ||
    isPausing ||
    isResuming ||
    cancelInFlight ||
    pauseInFlight ||
    resumeInFlight ||
    !canCancel ||
    !isSourceChainAvailable

  const [expanded, setExpanded] = useState(initialExpanded)
  const chevronProgress = useSharedValue(initialExpanded ? 1 : 0)

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
    // A `nextExecutionAt` in the past means the order was just resumed (or the
    // relayer hasn't caught up yet): it will be triggered on the next relayer
    // run — usually within a minute. We don't know the exact time, so showing
    // the stale scheduled timestamp would be misleading. Show a soft label
    // instead. (Matches the CP-14659 web behavior.)
    if (s.nextExecutionAt * 1000 <= Date.now()) {
      return (
        <Text variant="body1" sx={{ color: '$textSecondary' }}>
          In a few minutes
        </Text>
      )
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
      onLayout={
        onMeasureY ? e => onMeasureY(e.nativeEvent.layout.y) : undefined
      }
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
        {/* Status badge under the summary — visible regardless of expanded
            state so a non-active row is obvious in the list view without
            the user having to drill in. `Active` schedules render no
            badge (that's the implicit default). */}
        {STATUS_LABEL[s.status] && (
          <Text
            variant="body2"
            sx={{
              color: '$textSecondary',
              textAlign: 'center',
              marginTop: 4
            }}>
            {STATUS_LABEL[s.status]}
          </Text>
        )}
      </Pressable>

      {expanded && (
        <View sx={{ marginTop: 12, gap: 12 }}>
          {/* Pause / Resume sits to the LEFT of Cancel. The
              button's label, spinner state, and action depend on whether
              the schedule is currently active or paused: while paused, it
              acts as Resume; while active, it acts as Pause. The intent
              after the on-chain TX confirms is reflected by the server
              `status` flip and the pending-action store clearing. */}
          <ActionButtons
            isPaused={isPaused}
            isPausing={isPausing}
            isResuming={isResuming}
            isCancelling={isCancelling}
            canPause={canPause}
            canResume={canResume}
            cancelDisabled={cancelDisabled}
            isSourceChainAvailable={isSourceChainAvailable}
            schedule={s}
            fromToken={fromToken}
            toToken={toToken}
            onPause={onPause}
            onResume={onResume}
            onRemove={onRemove}
            dangerColor={colors.$textDanger}
          />

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

// Pause/Resume + Cancel action pair. Extracted from `ScheduleCard` so the
// per-side `<SplitButton>` config (status-dependent label, in-flight icon,
// gating) lives in its own function — keeps `ScheduleCard`'s cognitive
// complexity below the sonarjs cap without flattening into less-readable
// state.
type ActionButtonsProps = {
  isPaused: boolean
  isPausing: boolean
  isResuming: boolean
  isCancelling: boolean
  canPause: boolean
  canResume: boolean
  cancelDisabled: boolean
  isSourceChainAvailable: boolean
  schedule: RecurringOrder
  fromToken: ResolvedToken
  toToken: ResolvedToken
  onPause: ScheduleAction
  onResume: ScheduleAction
  onRemove: ScheduleAction
  dangerColor: string
}

function ActionButtons({
  isPaused,
  isPausing,
  isResuming,
  isCancelling,
  canPause,
  canResume,
  cancelDisabled,
  isSourceChainAvailable,
  schedule: s,
  fromToken,
  toToken,
  onPause,
  onResume,
  onRemove,
  dangerColor
}: ActionButtonsProps): JSX.Element {
  const pauseResume = isPaused
    ? {
        children: isResuming ? <ActivityIndicator size="small" /> : 'Resume',
        disabled: !canResume || !isSourceChainAvailable,
        onPress: () => onResume(s, fromToken, toToken)
      }
    : {
        children: isPausing ? <ActivityIndicator size="small" /> : 'Pause',
        disabled: !canPause || !isSourceChainAvailable,
        onPress: () => onPause(s, fromToken, toToken)
      }

  const cancel = {
    children: isCancelling ? (
      <ActivityIndicator size="small" color={dangerColor} />
    ) : (
      'Cancel'
    ),
    disabled: cancelDisabled,
    textStyle: { color: dangerColor },
    onPress: () => onRemove(s, fromToken, toToken)
  }

  return <SplitButton left={pauseResume} right={cancel} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export function RecurringSchedulesScreen({
  initialExpandedOrderId
}: {
  /** When the screen mounts via a notification deep link
   *  (`core://recurringSwapSchedules?orderId=…`), expand the matching card so
   *  the user lands directly on the order the notification was about. */
  initialExpandedOrderId?: string
} = {}): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const chainId = activeNetwork?.chainId
  const headerHeight = useEffectiveHeaderHeight()

  // Capture each card's measured y so we can scroll the deep-linked card
  // into view if it falls below the fold. Ref-based instead of state to
  // avoid re-rendering the whole list every time a card lays out.
  const scrollRef = useRef<ScrollView>(null)
  const cardYRef = useRef<Map<string, number>>(new Map())
  const didScrollRef = useRef(false)

  // Poll listOrders every 30s while this screen is mounted so the user sees
  // server-side state changes (next-execution advancing after a fill,
  // schedules completing, new failures indexed, cross-device cancellations)
  // without having to leave and come back. React Query pauses the interval
  // when the app backgrounds and resumes on foreground, and stops entirely
  // when the screen unmounts — so this only costs traffic while the user
  // is actually looking at the manage view. The banner / swap-modal
  // observers don't pass an interval, so the shared cache stays
  // event-driven elsewhere.
  //
  // `staleTime: 0` forces a refetch on every mount of this screen — the
  // user is about to take destructive per-row actions and shouldn't tap
  // Cancel against a snapshot that's up to 5 minutes old (the default
  // banner staleTime). RQ's in-flight dedupe means concurrent mount /
  // unlock-listener invalidates collapse to a single network call.
  const {
    data: schedules,
    isLoading,
    isError,
    refetch
  } = useRecurringSchedules(activeAccount?.addressC, chainId, {
    refetchIntervalMs: 30_000,
    staleTime: 0
  })

  const contractTokens = useNetworkContractTokens(activeNetwork)

  const cancel = useCancelRecurringSchedule()
  const pause = usePauseRecurringSchedule()
  const resume = useResumeRecurringSchedule()
  const { getNetwork } = useNetworks()

  // Include both Active and Paused — a paused schedule is still user-
  // manageable (Resume + Cancel) and should remain visible in the
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

  // Scroll the deep-linked card into view. Triggered by the card's own
  // `onLayout` so we don't fire before the card has been measured (which
  // is itself gated on the schedules fetch resolving). `didScrollRef`
  // ensures a single fire — subsequent layout passes (LinearTransition
  // animations, badge changes) won't keep yanking the scroll position.
  const handleCardMeasureY = useCallback(
    (orderId: string, y: number) => {
      cardYRef.current.set(orderId, y)
      if (didScrollRef.current) return
      if (orderId !== initialExpandedOrderId) return
      didScrollRef.current = true
      // Subtract the sticky-header height so the card lands just below it
      // instead of behind it. Clamp at 0 — the first card sits near the
      // top of the content already.
      const target = Math.max(0, y - headerHeight)
      // The card's `onLayout` can fire before the modal-presentation
      // animation finishes, which would let `scrollTo`'s animated scroll
      // complete behind the still-rising modal — the user lands already
      // positioned at the deep-linked card without seeing the scroll.
      // Defer to the next frame (so React's commit + the modal's first
      // present frame have shipped), then wait out the bulk of iOS's
      // sheet-presentation curve before kicking off the scroll so the
      // animation is visible to the user.
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y: target, animated: true })
        }, 250)
      })
    },
    [initialExpandedOrderId, headerHeight]
  )

  // Deep-linked orderId may not show up in the manageable list — the order
  // could be `cancelled` / `completed` (filtered out), belong to a different
  // account, or not exist on the active chain. Surface a one-shot snackbar
  // once the fetch settles so the user isn't left wondering why nothing
  // expanded. Only fires when the fetch succeeded (an error already renders
  // the Retry CTA inline).
  const notFoundShownRef = useRef(false)
  useEffect(() => {
    if (
      shouldShowDeepLinkNotFound({
        initialExpandedOrderId,
        isLoading,
        isError,
        alreadyShown: notFoundShownRef.current,
        orderIds: manageableSchedules.map(s => s.orderId)
      })
    ) {
      notFoundShownRef.current = true
      showSnackbar('Recurring schedule not found')
    }
  }, [initialExpandedOrderId, isLoading, isError, manageableSchedules])

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

  // Cancel / Pause / Resume share the same shape: validate owner →
  // resolve source chain → guard on missing network → confirm via native
  // alert → fire-and-forget the SDK mutation (the hook signs + broadcasts
  // internally via the evmSigner wired into FusionService, dispatching
  // through ApprovalController so the user sees Core's in-app approval
  // modal). Analytics + cache invalidation fire from the hook on
  // broadcast resolution. Symbols thread through to the recurring-action
  // side channel for the modal's preview block.
  // The row tuple (schedule + two resolved tokens) is already the
  // `ScheduleAction` shape used everywhere else in this screen; bundling
  // them into an ad-hoc object just to satisfy max-params would obscure
  // that, so suppress the rule across the arrow signature.
  /* eslint-disable max-params */
  const confirmAndRun = useCallback(
    (
      s: RecurringOrder,
      fromToken: ResolvedToken,
      toToken: ResolvedToken,
      prompt: {
        title: string
        description: string
        actionText: string
        actionStyle?: 'destructive' | 'default'
      },
      mutation: UseRecurringOrderAction
    ) => {
      // Owner mismatch guard: the visible rows can briefly belong to a
      // prior active account during an account switch (between the
      // selector flip and the next listOrders refetch settling). If the
      // user taps Cancel/Pause/Resume in that window, the FusionService
      // signer is already the new account's — signing for the old
      // account's order would 401/403 with a generic "Try again" toast.
      // Bail early with a clear message instead.
      const owner = s.owner.toLowerCase()
      const active = activeAccount?.addressC?.toLowerCase()
      if (!active || owner !== active) {
        showSnackbar('Switch to the schedule’s owner account to continue')
        return
      }

      const sourceChain = buildSourceChain(s)
      if (!sourceChain) {
        showSnackbar('Network not available — try again')
        return
      }
      showAlert({
        title: prompt.title,
        description: prompt.description,
        buttons: [
          {
            text: prompt.actionText,
            style: prompt.actionStyle ?? 'default',
            onPress: () =>
              mutation.mutate({
                orderId: s.orderId,
                address: s.owner,
                sourceChain,
                chainId: s.chainId,
                fromTokenSymbol: fromToken.symbol,
                toTokenSymbol: toToken.symbol
              })
          },
          { text: 'Cancel', style: 'default' }
        ]
      })
    },
    [buildSourceChain, activeAccount?.addressC]
  )
  /* eslint-enable max-params */

  const handleRemove = useCallback<ScheduleAction>(
    (s, fromToken, toToken) =>
      confirmAndRun(
        s,
        fromToken,
        toToken,
        {
          title: 'Are you sure you want to cancel this recurring swap?',
          description:
            'Scheduled swaps may still execute while this action is confirmed.',
          actionText: 'Remove',
          actionStyle: 'destructive'
        },
        cancel
      ),
    [confirmAndRun, cancel]
  )

  const handlePause = useCallback<ScheduleAction>(
    (s, fromToken, toToken) =>
      confirmAndRun(
        s,
        fromToken,
        toToken,
        {
          title: 'Pause this recurring swap?',
          description:
            'This may take a few minutes. Scheduled swaps will execute until this action is confirmed.',
          actionText: 'Pause',
          actionStyle: 'destructive'
        },
        pause
      ),
    [confirmAndRun, pause]
  )

  const handleResume = useCallback<ScheduleAction>(
    (s, fromToken, toToken) =>
      confirmAndRun(
        s,
        fromToken,
        toToken,
        {
          title: 'Resume this recurring swap?',
          description:
            'Remaining fills will execute on the original cadence once this transaction confirms on-chain.',
          actionText: 'Resume',
          actionStyle: 'destructive'
        },
        resume
      ),
    [confirmAndRun, resume]
  )

  const swapWord = `swap${manageableCount === 1 ? '' : 's'}`
  // Force the screen header to break after "{N} recurring" so "swaps scheduled"
  // always sits on a second line, regardless of the count's width.
  const title = `${manageableCount} recurring\n${swapWord} scheduled`
  const navigationTitle = `${manageableCount} recurring ${swapWord} scheduled`

  // While the first fetch is in flight we have no real count yet — rendering the
  // "{N} recurring swaps scheduled" header would flash a misleading "0 …". Per
  // design, show only a centered spinner over the modal until data resolves.
  if (isLoading) {
    return (
      <ScrollScreen
        isModal
        contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.$textPrimary} />
        </View>
      </ScrollScreen>
    )
  }

  return (
    <ScrollScreen
      ref={scrollRef}
      title={title}
      navigationTitle={navigationTitle}
      isModal
      contentContainerStyle={{ padding: 16 }}>
      {/* Distinguish "Markr fetch failed with no cached data" from "fetch
          succeeded and you have zero schedules". The previous render
          collapsed both into the empty state, which made a server
          outage look like "your schedules disappeared". */}
      {isError && manageableSchedules.length === 0 && (
        <View sx={{ alignItems: 'center', paddingTop: 32, gap: 12 }}>
          <Text variant="body2" sx={{ color: '$textSecondary' }}>
            Couldn’t load recurring swaps.
          </Text>
          <Button type="secondary" size="medium" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      )}
      {!isError && manageableSchedules.length === 0 && (
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
          onResume={handleResume}
          // Pre-resolve the source chain once per row so the buttons can
          // disable visually instead of relying on the post-tap snackbar.
          // `buildSourceChain` is cheap (Redux lookup + a sync `toChain`),
          // and runs inside the same memoized cycle as the parent render.
          isSourceChainAvailable={buildSourceChain(s) !== undefined}
          cancelInFlight={cancel.isPending}
          pauseInFlight={pause.isPending}
          resumeInFlight={resume.isPending}
          initialExpanded={s.orderId === initialExpandedOrderId}
          onMeasureY={y => handleCardMeasureY(s.orderId, y)}
        />
      ))}
    </ScrollScreen>
  )
}
