import LombardWordmarkDark from 'assets/icons/lombard-wordmark-dark.svg'
import LombardWordmarkLight from 'assets/icons/lombard-wordmark-light.svg'
import { formatTokenAmount } from 'utils/Utils'
import { bigintToBig, TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  Button,
  GroupList,
  GroupListItem,
  Icons,
  Separator,
  Text,
  Toggle,
  Tooltip,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { TokenType, TokenWithBalance } from '@avalabs/vm-module-types'
import { SwapSide } from '@paraswap/sdk'
import { useNavigation } from '@react-navigation/native'
import { ErrorState } from 'common/components/ErrorState'
import { ScrollScreen } from 'common/components/ScrollScreen'
import {
  TokenInputWidget,
  TokenInputWidgetRef
} from 'common/components/TokenInputWidget'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import {
  FORM_SHEET_FOCUS_BUFFER_MS,
  useAfterScreenEnterTransition
} from 'common/hooks/useAfterScreenEnterTransition'
import { usePreventScreenRemoval } from 'common/hooks/usePreventScreenRemoval'
import { dismissKeyboardIfNeeded } from 'common/utils/dismissKeyboardIfNeeded'
import { showSnackbar } from 'common/utils/toast'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useLocalSearchParams, useRouter } from 'expo-router'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import useSolanaNetwork from 'hooks/earn/useSolanaNetwork'
import { useDebounce } from 'hooks/useDebounce'
import { useNetworks } from 'hooks/networks/useNetworks'
import { toChain } from 'features/swap/utils/fusionTypeConverters'
import { isInvalidParamsError } from '@avalabs/fusion-sdk'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition
} from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { LocalTokenWithBalance } from 'store/balance'
import { basisPointsToPercentage } from 'utils/basisPointsToPercentage'
import { useTokensWithZeroBalanceByNetworksForAccount } from 'features/portfolio/hooks/useTokensWithZeroBalanceByNetworksForAccount'
import { selectActiveAccount } from 'store/account'
import { selectActiveWallet } from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'
import Logger from 'utils/Logger'
import { tokenIds } from 'consts/tokenIds'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { caip2ChainIds } from 'consts/caip2ChainIds'
import { selectActiveAccountHasSolanaAddress } from 'store/account'
import {
  selectIsRecurringSwapsBlocked,
  selectIsSolanaSwapBlocked,
  selectMarkrSwapMaxRetries
} from 'store/posthog'
import { useRecurringSwapContext } from 'features/recurringSwap/contexts/RecurringSwapContext'
import { useRecurringEligibility } from 'features/recurringSwap/hooks/useRecurringEligibility'
import { useRecurringQuote } from 'features/recurringSwap/hooks/useRecurringQuote'
import { RecurringDetailsRows } from 'features/recurringSwap/components/RecurringDetailsRows'
import { RecurringSchedulesBanner } from 'features/recurringSwap/components/RecurringSchedulesBanner'
import { submitRecurringSwap } from 'features/recurringSwap/utils/submitRecurringSwap'
import { AdditiveFeesNotice } from '../components/AdditiveFeesNotice'
import { FeeDebugTable } from '../components/FeeDebugTable'
import { useFusionTokenLookup } from '../hooks/useFusionTokenLookup'
import { SwapStatus, useSwapContext } from '../contexts/SwapContext'
import {
  fusionTransfersStore,
  useFusionServiceInitError
} from '../hooks/useZustandStore'
import { FusionQuoteError, fusionErrors } from '../utils/fusionErrors'
import { clampToNAvax } from '../utils/clampToNAvax'
import { isAvalancheCctRoute } from '../utils/isAvalancheCctRoute'
import { shouldShowAvalancheCctTwoTxNotice } from '../utils/shouldShowAvalancheCctTwoTxNotice'
import { useSwapRate } from '../hooks/useSwapRate'
import { useSupportedChains } from '../hooks/useSupportedChains'
import { getDisplaySlippageValue } from '../utils/getDisplaySlippageValue'
import { ServiceType } from '../types'
import { usePriceImpact } from '../hooks/usePriceImpact'
import {
  PriceImpactAvailability,
  PriceImpactSeverity,
  PRICE_IMPACT_ROW_TITLE,
  PRICE_IMPACT_TOOLTIP_BODY,
  PRICE_IMPACT_UNKNOWN_RISK_TITLE,
  PRICE_IMPACT_UNKNOWN_RISK_DESCRIPTION,
  PRICE_IMPACT_SWAP_DISABLED_TITLE,
  PRICE_IMPACT_SWAP_DISABLED_DESCRIPTION,
  PRICE_IMPACT_HIGH_TITLE
} from '../consts'
import { useMaxSwapAmount } from '../hooks/useMaxSwapAmount'
import { useMinimumTransferAmount } from '../hooks/useMinimumTransferAmount'
import { useFeeValidation } from '../hooks/useFeeValidation'
import { useAutoAdvanceOnFeeValidationError } from '../hooks/useAutoAdvanceOnFeeValidationError'
import { getTokenKey } from '../utils/tokenKey'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SwapDetailItemsParams = {
  activeQuote: { slippageBps?: number } | null
  allQuotes: unknown[]
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  rate: number
  isMarkrRoute: boolean
  autoSlippage: boolean
  slippage: number
  isSwapping: boolean
  priceImpactItem: GroupListItem
  handleSelectPricingDetails: () => void
  handleSelectSlippageDetails: () => void
  // Markr's per-pair recurring recommendation (bps). When set, the recurring
  // toggle is on and this overrides the one-time quote's slippage in the row.
  recurringRecommendedSlippageBps?: number
}

/**
 * Builds the GroupList data items for the swap details section.
 * Extracted from SwapScreen to keep the component's cognitive complexity within limit.
 */
function buildSwapDetailItems({
  activeQuote,
  allQuotes,
  fromToken,
  toToken,
  rate,
  isMarkrRoute,
  autoSlippage,
  slippage,
  isSwapping,
  priceImpactItem,
  handleSelectPricingDetails,
  handleSelectSlippageDetails,
  recurringRecommendedSlippageBps
}: SwapDetailItemsParams): GroupListItem[] {
  const items: GroupListItem[] = []

  if (!activeQuote || allQuotes.length === 0) return items

  if (fromToken && toToken && rate) {
    const haveMultipleQuotes = allQuotes.length > 1
    items.push({
      title: haveMultipleQuotes ? 'Pricing' : 'Rate',
      value: `1 ${fromToken.symbol} = ${rate.toFixed(4)} ${toToken.symbol}`,
      onPress: handleSelectPricingDetails
    })
  }

  if (isMarkrRoute) {
    const displayValue = getDisplaySlippageValue({
      autoSlippage,
      quoteSlippageBps:
        recurringRecommendedSlippageBps ?? activeQuote?.slippageBps,
      manualSlippage: slippage
    })
    items.push({
      title: 'Slippage',
      value: displayValue,
      onPress: isSwapping ? undefined : handleSelectSlippageDetails
    })
    items.push(priceImpactItem)
  }

  return items
}

/**
 * Computes the current swap validation error (or null if inputs are valid).
 * Extracted from SwapScreen to keep the component's cognitive complexity within limit.
 */
function computeValidationError({
  fromTokenValue,
  debouncedFromTokenValue,
  minimumTransferAmount,
  fromToken,
  feeValidationError
}: {
  fromTokenValue: bigint | undefined
  debouncedFromTokenValue: bigint | undefined
  minimumTransferAmount: bigint | null | undefined
  fromToken: LocalTokenWithBalance | undefined
  feeValidationError: FusionQuoteError | null | undefined
}): FusionQuoteError | null {
  if (fromTokenValue === undefined) return null
  if (debouncedFromTokenValue !== undefined && debouncedFromTokenValue === 0n) {
    return fusionErrors.enterAmount()
  }
  if (
    minimumTransferAmount != null &&
    debouncedFromTokenValue !== undefined &&
    debouncedFromTokenValue > 0n &&
    debouncedFromTokenValue < minimumTransferAmount &&
    fromToken &&
    'decimals' in fromToken
  ) {
    const formattedMin = `${formatTokenAmount(
      bigintToBig(minimumTransferAmount, fromToken.decimals),
      fromToken.decimals
    )} ${fromToken.symbol}`
    return fusionErrors.belowMinimumAmount(formattedMin)
  }
  if (
    debouncedFromTokenValue !== undefined &&
    fromToken !== undefined &&
    debouncedFromTokenValue > fromToken.balance
  ) {
    return fusionErrors.exceedsBalance()
  }
  return feeValidationError ?? null
}

/**
 * Builds the GroupListItem for the price-impact row.
 * Extracted from SwapScreen to keep the component's cognitive complexity within limit.
 */
function buildPriceImpactItem({
  priceImpact,
  priceImpactSeverity,
  priceImpactAvailability,
  dangerColor,
  secondaryColor
}: {
  priceImpact: number | undefined
  priceImpactSeverity: PriceImpactSeverity | undefined
  priceImpactAvailability: PriceImpactAvailability | 'unavailable'
  dangerColor: string
  secondaryColor: string
}): GroupListItem {
  if (priceImpactAvailability === PriceImpactAvailability.Calculating) {
    return {
      title: PRICE_IMPACT_ROW_TITLE,
      value: <ActivityIndicator size="small" />
    }
  }

  let color: string
  let displayText: string
  let tooltipTitle: string
  let tooltipDescription: string

  if (priceImpactAvailability === 'unavailable') {
    color = dangerColor
    displayText = PRICE_IMPACT_UNKNOWN_RISK_TITLE
    tooltipTitle = PRICE_IMPACT_UNKNOWN_RISK_TITLE
    tooltipDescription = PRICE_IMPACT_UNKNOWN_RISK_DESCRIPTION
  } else if (priceImpactSeverity === PriceImpactSeverity.Critical) {
    color = dangerColor
    displayText = `${priceImpact?.toFixed(2)}% (High)`
    tooltipTitle = PRICE_IMPACT_SWAP_DISABLED_TITLE
    tooltipDescription = PRICE_IMPACT_SWAP_DISABLED_DESCRIPTION
  } else if (priceImpactSeverity === PriceImpactSeverity.High) {
    color = dangerColor
    displayText = `${priceImpact?.toFixed(2)}% (High)`
    tooltipTitle = PRICE_IMPACT_HIGH_TITLE
    tooltipDescription = PRICE_IMPACT_TOOLTIP_BODY
  } else {
    color = secondaryColor
    displayText = priceImpact !== undefined ? `${priceImpact.toFixed(2)}%` : '—'
    tooltipTitle = PRICE_IMPACT_ROW_TITLE
    tooltipDescription = PRICE_IMPACT_TOOLTIP_BODY
  }

  return {
    title: PRICE_IMPACT_ROW_TITLE,
    value: (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Tooltip
          title={tooltipTitle}
          description={tooltipDescription}
          button={{ text: 'Dismiss' }}
          size={18}
        />
        <Text variant="body1" style={{ color }}>
          {displayText}
        </Text>
      </View>
    )
  }
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- complexity arises from React idioms (nested useEffect callbacks with inner fns); logic is decomposed into buildSwapDetailItems, buildPriceImpactItem, computeValidationError
export const SwapScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { navigate, dismissAll, push } = useRouter()
  const navigation = useNavigation()
  const [fusionInitError] = useFusionServiceInitError()

  const {
    initialTokenIdFrom: rawTokenIdFrom,
    initialTokenIdTo: rawTokenIdTo,
    initialFromCaip2Id: rawFromCaip2Id,
    initialToCaip2Id: rawToCaip2Id
  } = useLocalSearchParams<{
    initialTokenIdFrom?: string // internalId
    initialTokenIdTo?: string // internalId
    initialFromCaip2Id?: string
    initialToCaip2Id?: string
  }>()

  const initialTokenInfo = useMemo(() => {
    const tokenIdFrom = rawTokenIdFrom || undefined
    const tokenIdTo = rawTokenIdTo || undefined
    const fromCaip2Id = rawFromCaip2Id || undefined
    const toCaip2Id = rawToCaip2Id || undefined
    const defaultCaip2Id = isDeveloperMode
      ? caip2ChainIds.FUJI
      : caip2ChainIds.C_CHAIN

    const isDefaultSwapPair =
      tokenIdFrom === undefined && tokenIdTo === undefined
    if (isDefaultSwapPair) {
      return {
        initialTokenIdFrom: tokenIds.AVAX,
        // In testnet, USDC is a mainnet-only token with no supported services,
        // so we skip preselecting it to avoid a broken no-quotes state.
        initialTokenIdTo: isDeveloperMode ? undefined : tokenIds.USDC,
        initialFromCaip2Id: defaultCaip2Id,
        initialToCaip2Id: isDeveloperMode ? undefined : defaultCaip2Id
      }
    }
    return {
      initialTokenIdFrom: tokenIdFrom,
      initialTokenIdTo: tokenIdTo,
      initialFromCaip2Id: fromCaip2Id ?? defaultCaip2Id,
      initialToCaip2Id: toCaip2Id ?? defaultCaip2Id
    }
  }, [
    rawTokenIdFrom,
    rawTokenIdTo,
    rawFromCaip2Id,
    rawToCaip2Id,
    isDeveloperMode
  ])

  const { formatCurrency } = useFormatCurrency()
  const { getMarketTokenById } = useWatchlist()
  const cChainNetwork = useCChainNetwork()

  const {
    swap,
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    userQuote,
    activeQuote,
    allQuotes,
    isQuoteLoading,
    setDestination,
    slippage,
    autoSlippage,
    setAmount,
    quoteError,
    swapStatus,
    successTransferId,
    advanceBestQuote,
    setUserClickedMax
  } = useSwapContext()
  const [fromTokenValue, setFromTokenValue] = useState<bigint>()
  const [toTokenValue, setToTokenValue] = useState<bigint>()
  const [validationError, setValidationError] =
    useState<FusionQuoteError | null>(null)
  const minimumTransferAmount = useMinimumTransferAmount({ fromToken, toToken })

  const {
    debounced: debouncedFromTokenValue,
    setValueImmediately: resetDebouncedFromTokenValue
  } = useDebounce(fromTokenValue)
  const solanaNetwork = useSolanaNetwork()
  const activeAccount = useSelector(selectActiveAccount)
  const activeWallet = useSelector(selectActiveWallet)
  const isSeedlessWallet = activeWallet?.type === WalletType.SEEDLESS
  const accountTokens = useTokensWithBalanceForAccount({
    account: activeAccount
  })

  const { isTokensLoading, btcBLocalToken } = useFusionTokenLookup({
    tokenInfo: initialTokenInfo,
    accountTokens,
    isDeveloperMode,
    setFromToken,
    setToToken
  })

  const hasSolanaAddress = useSelector(selectActiveAccountHasSolanaAddress)
  const isSolanaSwapBlocked = useSelector(selectIsSolanaSwapBlocked)
  const showSolanaSwap = hasSolanaAddress && !isSolanaSwapBlocked

  const isRecurringBlocked = useSelector(selectIsRecurringSwapsBlocked)
  const recurring = useRecurringSwapContext()
  const evmAddress = activeAccount?.addressC
  const eligibility = useRecurringEligibility(
    isRecurringBlocked ? undefined : fromToken,
    isRecurringBlocked ? undefined : toToken,
    isRecurringBlocked ? undefined : evmAddress
  )
  // Recurring per-token minimum sourced from `/info/chains` (via SDK eligibility
  // check, which keys on the source token address). Available whenever the pair
  // is supported, even before the user enters an amount.
  const recurringMinimumTransferAmount = useMemo<bigint | null>(() => {
    if (!eligibility.eligible) return null
    try {
      return BigInt(eligibility.minimumAmount)
    } catch {
      return null
    }
  }, [eligibility])
  // Recurring on → validate against the supportedTokens minimum.
  // Recurring off → validate against the active quote's one-shot minimum.
  const effectiveMinimumTransferAmount = recurring.isRecurring
    ? recurringMinimumTransferAmount
    : minimumTransferAmount
  // Toggle stays hidden until the user enters a non-zero amount (matches Figma
  // "Recurring OFF" frame — the toggle row only appears beneath a populated
  // swap card). The recurring flag itself is preserved when the amount is
  // cleared so re-entering an amount restores the previous on/off choice.
  const hasFromAmount = fromTokenValue !== undefined && fromTokenValue > 0n
  const showRecurringToggle =
    !isRecurringBlocked && eligibility.eligible && hasFromAmount
  const [recurringSubmitting, setRecurringSubmitting] = useState(false)

  // Subscribe to the recurring quote when the toggle is on so we have fresh
  // calldata ready by the time the user presses Next. `slippage` in SwapContext
  // is in percent (e.g. 2 = 2%); the hook expects basis points. With auto on we
  // pass undefined to let the server pick recommendedSlippage.
  const recurringSlippageBps =
    autoSlippage || slippage === undefined
      ? undefined
      : Math.round(slippage * 100)
  const recurringQuote = useRecurringQuote({
    fromToken: recurring.isRecurring ? fromToken ?? undefined : undefined,
    toToken: recurring.isRecurring ? toToken ?? undefined : undefined,
    amountPerOrder: recurring.isRecurring ? fromTokenValue : undefined,
    numberOfOrders: recurring.numberOfOrders,
    frequency: recurring.frequency,
    slippageBps: recurringSlippageBps
  })

  const tokensWithZeroBalance = useTokensWithZeroBalanceByNetworksForAccount(
    activeAccount,
    [
      cChainNetwork?.chainId,
      showSolanaSwap ? solanaNetwork?.chainId : undefined
    ].filter(chainId => chainId !== undefined) as number[]
  )

  const { getNetwork } = useNetworks()

  Logger.info('activeQuote', activeQuote)

  const {
    max: fromMaxSwapAmount,
    rawAdditiveFee: maxRawAdditiveFee,
    bufferedAdditiveFee: maxBufferedAdditiveFee,
    routeAdditiveBps: maxRouteAdditiveBps,
    rawGasFee: maxRawGasFee,
    bufferedGasFee: maxBufferedGasFee,
    gasSafetyBps: maxGasSafetyBps,
    rawNativeAdditiveFee: maxRawNativeAdditiveFee,
    bufferedNativeAdditiveFee: maxBufferedNativeAdditiveFee
  } = useMaxSwapAmount({
    fromToken,
    toToken,
    minimumTransferAmount
  })

  const nativeFromToken = useMemo(
    () =>
      fromToken
        ? accountTokens.find(
            t =>
              t.type === TokenType.NATIVE &&
              t.networkChainId === fromToken.networkChainId
          )
        : undefined,
    [fromToken, accountTokens]
  )

  const {
    error: feeValidationError,
    isValidating: isFeeValidating,
    rawAdditiveFee: liveRawAdditiveFee,
    bufferedAdditiveFee: liveBufferedAdditiveFee,
    rawNativeAdditiveFee: liveRawNativeAdditiveFee,
    bufferedNativeAdditiveFee: liveBufferedNativeAdditiveFee,
    rawGasFee: liveRawGasFee,
    bufferedGasFee: liveBufferedGasFee,
    gasSafetyBps: liveGasSafetyBps,
    routeAdditiveBps: liveRouteAdditiveBps
  } = useFeeValidation({
    fromToken,
    nativeTokenBalance: nativeFromToken?.balance,
    amount: debouncedFromTokenValue,
    quote: activeQuote
  })

  const maxQuoteAdvances = useSelector(selectMarkrSwapMaxRetries)

  const isSwapping = swapStatus === SwapStatus.Swapping

  useAutoAdvanceOnFeeValidationError({
    feeValidationError,
    isValidating: isFeeValidating,
    isSwapping,
    activeQuote,
    allQuotes,
    userQuote,
    advanceBestQuote,
    maxAdvances: maxQuoteAdvances
  })

  const activeError = validationError ?? quoteError

  const {
    priceImpact,
    priceImpactSeverity,
    priceImpactAvailability,
    isPriceImpactTooHigh,
    isPriceImpactCalculating
  } = usePriceImpact(activeQuote, fromToken, toToken)

  const canSwap: boolean =
    (activeError === null ||
      (activeError instanceof FusionQuoteError &&
        activeError.isWarning === true)) &&
    !isFeeValidating &&
    !!fromToken &&
    !!toToken &&
    !!activeQuote &&
    !isPriceImpactCalculating &&
    !isPriceImpactTooHigh

  const corePhrase = useMemo(() => {
    if (!activeQuote) return

    // Fusion SDK Quote has partnerFeeBps directly
    const feeBps = activeQuote.partnerFeeBps

    const partnerName = activeQuote.fees?.find(
      fee => fee.type === 'partner'
    )?.name

    if (!feeBps || !partnerName) return

    return `a ${basisPointsToPercentage(feeBps)} ${partnerName}`
  }, [activeQuote])

  const updateMissingTokenPrice = useCallback(
    async (token: LocalTokenWithBalance | undefined) => {
      if (token?.priceInCurrency !== 0) return

      const marketToken = getMarketTokenById(token.internalId ?? '')

      if (marketToken?.currentPrice) {
        setToToken({
          ...token,
          priceInCurrency: marketToken?.currentPrice
        })
      }
    },
    [getMarketTokenById, setToToken]
  )

  useEffect(() => {
    updateMissingTokenPrice(toToken)
  }, [toToken, updateMissingTokenPrice])

  const validateInputs = useCallback(() => {
    // fromTokenValue drives the reset — if it's undefined (token just changed),
    // clear any error immediately without waiting for the debounce to settle.
    setValidationError(
      computeValidationError({
        fromTokenValue,
        debouncedFromTokenValue,
        minimumTransferAmount: effectiveMinimumTransferAmount,
        fromToken,
        feeValidationError
      })
    )
  }, [
    fromTokenValue,
    debouncedFromTokenValue,
    effectiveMinimumTransferAmount,
    fromToken,
    feeValidationError
  ])

  const applyQuote = useCallback(() => {
    if (!debouncedFromTokenValue || !activeQuote) {
      setToTokenValue(undefined)
      return
    }

    // Fusion SDK Quote has amountOut as bigint - fees are already included
    // No need to apply fee deduction - the SDK/backend handles all fees
    const amountOut = activeQuote.amountOut

    if (amountOut) {
      setToTokenValue(amountOut)
    }
  }, [activeQuote, debouncedFromTokenValue])

  const isMarkrRoute = activeQuote?.serviceType === ServiceType.MARKR

  const isLombard =
    activeQuote?.serviceType === ServiceType.LOMBARD_BTC_TO_BTCB ||
    activeQuote?.serviceType === ServiceType.LOMBARD_BTCB_TO_BTC

  const handleSwap = useCallback(() => {
    if (!activeQuote) return
    AnalyticsService.capture('SwapReviewOrder', {
      provider: activeQuote.aggregator.name,
      slippage
    })

    dismissKeyboardIfNeeded()

    swap(activeQuote)
  }, [swap, activeQuote, slippage])

  const handleFromAmountChange = useCallback(
    (amount: bigint): void => {
      // CCT atomic txs operate in nAVAX (1e9). For 18-decimal C-Chain AVAX,
      // floor the trailing wei so what the user sees is what gets sent.
      // Mirrors the staking flow's `toFixed(9)` clamp.
      const decimals =
        fromToken &&
        'decimals' in fromToken &&
        typeof fromToken.decimals === 'number'
          ? fromToken.decimals
          : undefined
      const next =
        isAvalancheCctRoute({ fromToken, toToken }) && decimals !== undefined
          ? clampToNAvax(amount, decimals)
          : amount
      setFromTokenValue(next)
      setDestination(SwapSide.SELL)
      setUserClickedMax(false)
    },
    [fromToken, toToken, setDestination, setUserClickedMax]
  )

  const handlePressMax = useCallback((): void => {
    setUserClickedMax(true)
  }, [setUserClickedMax])

  const handleToAmountChange = useCallback(
    (amount: bigint): void => {
      setToTokenValue(amount)
      setDestination(SwapSide.BUY)
      setAmount(amount)
      setUserClickedMax(false)
    },
    [setDestination, setAmount, setUserClickedMax]
  )

  const handleSelectFromToken = useCallback(async (): Promise<void> => {
    await dismissKeyboardIfNeeded()

    const tokenParams = fromToken?.networkChainId
      ? { networkChainId: fromToken.networkChainId.toString() }
      : {}

    navigate({
      pathname: '/selectSwapFromToken',
      params: tokenParams
    })
  }, [navigate, fromToken])

  const handleSelectToToken = useCallback(async (): Promise<void> => {
    await dismissKeyboardIfNeeded()

    const tokenParams = fromToken?.networkChainId
      ? { networkChainId: fromToken.networkChainId.toString() }
      : {}

    navigate({
      pathname: '/selectSwapToToken',
      params: tokenParams
    })
  }, [navigate, fromToken])

  const handleSelectPricingDetails = useCallback((): void => {
    navigate('/swap/pricingDetails')
  }, [navigate])

  const handleSelectSlippageDetails = useCallback((): void => {
    navigate('/swap/slippageDetails')
  }, [navigate])

  const formatInCurrency = useCallback(
    (
      token: TokenWithBalance | undefined,
      value: bigint | undefined
    ): string => {
      if (!token?.priceInCurrency || !('decimals' in token)) {
        return UNKNOWN_AMOUNT
      }

      return formatCurrency({
        amount: new TokenUnit(value ?? 0n, token.decimals, token.symbol)
          .mul(token.priceInCurrency)
          .toDisplay({ asNumber: true })
      })
    },
    [formatCurrency]
  )

  // Defer auto-focus until the modal's enter transition has completed.
  // Focusing during the transition races the keyboard spring-up and the
  // KeyboardAwareScrollView's input-into-view scroll, which on Android can
  // collapse the fading header into a half-broken state where the "Swap"
  // title disappears and "You pay" is clipped by the navigation bar (CP-13946).
  const fromTokenInputRef = useRef<TokenInputWidgetRef>(null)
  const hasAutoFocusedRef = useRef(false)
  useAfterScreenEnterTransition(
    () => {
      if (hasAutoFocusedRef.current) return
      hasAutoFocusedRef.current = true
      fromTokenInputRef.current?.focus()
    },
    {
      layoutBufferMs: FORM_SHEET_FOCUS_BUFFER_MS
    }
  )

  const renderFromSection = useCallback(() => {
    return (
      <View
        style={{
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          overflow: 'hidden',
          backgroundColor: theme.colors.$surfaceSecondary,
          paddingBottom: 4
        }}>
        <TokenInputWidget
          ref={fromTokenInputRef}
          amountInputTestID="token_amount_input_field__you_pay"
          disabled={isSwapping}
          editable={!isSwapping}
          amount={fromTokenValue}
          balance={fromToken?.balance}
          shouldShowBalance={true}
          title="You pay"
          token={
            fromToken && 'decimals' in fromToken
              ? {
                  symbol: fromToken.symbol,
                  logoUri: fromToken.logoUri,
                  decimals: fromToken.decimals
                }
              : undefined
          }
          network={getNetwork(fromToken?.networkChainId)}
          formatInCurrency={amount => formatInCurrency(fromToken, amount)}
          onAmountChange={handleFromAmountChange}
          onPressMax={handlePressMax}
          onSelectToken={handleSelectFromToken}
          maximum={fromMaxSwapAmount}
          valid={!validationError}
        />
      </View>
    )
  }, [
    theme,
    formatInCurrency,
    handleFromAmountChange,
    handlePressMax,
    handleSelectFromToken,
    getNetwork,
    fromToken,
    fromMaxSwapAmount,
    validationError,
    fromTokenValue,
    isSwapping
  ])

  const renderToSection = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          paddingTop: 4,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          overflow: 'hidden',
          backgroundColor: theme.colors.$surfaceSecondary
        }}>
        <TokenInputWidget
          amountInputTestID="token_amount_input_field__you_receive"
          disabled={isSwapping}
          editable={false}
          amount={toTokenValue}
          balance={toToken?.balance}
          shouldShowBalance={true}
          title="You receive"
          token={
            toToken && 'decimals' in toToken
              ? {
                  symbol: toToken.symbol,
                  logoUri: toToken.logoUri,
                  decimals: toToken.decimals
                }
              : undefined
          }
          network={getNetwork(toToken?.networkChainId)}
          formatInCurrency={amount => formatInCurrency(toToken, amount)}
          onAmountChange={handleToAmountChange}
          onSelectToken={handleSelectToToken}
          isLoadingAmount={isQuoteLoading}
        />
      </View>
    )
  }, [
    theme,
    formatInCurrency,
    handleToAmountChange,
    toToken,
    getNetwork,
    toTokenValue,
    isQuoteLoading,
    handleSelectToToken,
    isSwapping
  ])

  const rate = useSwapRate({
    quote: activeQuote,
    fromToken,
    toToken
  })

  const priceImpactItem = useMemo(
    (): GroupListItem =>
      buildPriceImpactItem({
        priceImpact,
        priceImpactSeverity,
        priceImpactAvailability,
        dangerColor: theme.colors.$textDanger,
        secondaryColor: theme.colors.$textSecondary
      }),
    [
      priceImpact,
      priceImpactSeverity,
      priceImpactAvailability,
      theme.colors.$textDanger,
      theme.colors.$textSecondary
    ]
  )

  const recurringRecommendedSlippageBps = recurring.isRecurring
    ? recurringQuote.data?.recommendedSlippage
    : undefined

  const data = useMemo(
    () =>
      buildSwapDetailItems({
        activeQuote,
        allQuotes,
        fromToken,
        toToken,
        rate,
        isMarkrRoute,
        autoSlippage,
        slippage,
        isSwapping,
        priceImpactItem,
        handleSelectPricingDetails,
        handleSelectSlippageDetails,
        recurringRecommendedSlippageBps
      }),
    [
      fromToken,
      toToken,
      rate,
      activeQuote,
      allQuotes,
      isMarkrRoute,
      slippage,
      autoSlippage,
      isSwapping,
      priceImpactItem,
      handleSelectPricingDetails,
      handleSelectSlippageDetails,
      recurringRecommendedSlippageBps
    ]
  )

  // Prefer popping the parent stack; fall back to dismissing the whole modal
  // when this screen is the root of a modal stack (no back history).
  const dismissOrGoBack = useCallback((): void => {
    if (navigation.getParent()?.canGoBack()) {
      navigation.getParent()?.goBack()
    } else {
      dismissAll()
    }
  }, [navigation, dismissAll])

  useEffect(() => {
    if (swapStatus === SwapStatus.Success) {
      if (successTransferId) {
        const transfer =
          fusionTransfersStore.getState().transfers[successTransferId]?.transfer
        const isCrossChain =
          transfer !== undefined &&
          transfer.sourceChain.chainId !== transfer.targetChain.chainId
        if (isCrossChain) {
          dismissAll()
          push({
            pathname: '/notifications/swapDetail',
            params: { id: successTransferId }
          })
          return
        }
      }
      dismissOrGoBack()
    }
  }, [dismissAll, push, swapStatus, successTransferId, dismissOrGoBack])

  // Trigger quote fetch when debounced amount settles, skip if below minimum
  const syncDebouncedAmount = useCallback(() => {
    if (recurring.isRecurring) return // paused; recurring uses its own quote hook
    if (debouncedFromTokenValue === undefined) return
    if (
      minimumTransferAmount != null &&
      debouncedFromTokenValue > 0n &&
      debouncedFromTokenValue < minimumTransferAmount
    )
      return
    setAmount(debouncedFromTokenValue)
  }, [
    recurring.isRecurring,
    debouncedFromTokenValue,
    minimumTransferAmount,
    setAmount
  ])

  useEffect(validateInputs, [validateInputs])
  useEffect(applyQuote, [applyQuote])
  useEffect(syncDebouncedAmount, [syncDebouncedAmount])

  // Reset recurring toggle only when the pair becomes ineligible (e.g. user
  // picks a cross-chain or unsupported destination) or the feature flag flips
  // off. Clearing the amount intentionally does NOT reset the flag — the user's
  // on/off choice persists until they manually toggle off or the token is no
  // longer supported.
  useEffect(() => {
    const recurringDisallowed = isRecurringBlocked || !eligibility.eligible
    if (recurringDisallowed && recurring.isRecurring) {
      recurring.setIsRecurring(false)
    }
  }, [
    isRecurringBlocked,
    eligibility.eligible,
    recurring.isRecurring,
    recurring.setIsRecurring
  ])

  // Reset from amount only when the pay token changes, so we don't show a stale
  // Max value or a spurious error while the new max is loading.
  // Changing the receive token keeps the entered amount — the receive amount
  // resets automatically when a new quote is fetched.
  const prevFromTokenKeyRef = useRef(
    fromToken ? getTokenKey(fromToken) : undefined
  )
  useEffect(() => {
    const fromKey = fromToken ? getTokenKey(fromToken) : undefined
    const prevFromKey = prevFromTokenKeyRef.current
    prevFromTokenKeyRef.current = fromKey

    if (prevFromKey === undefined || prevFromKey === fromKey) return

    setFromTokenValue(undefined)
    resetDebouncedFromTokenValue(undefined)
    setAmount(undefined)
    setUserClickedMax(false)
  }, [
    fromToken,
    setFromTokenValue,
    setAmount,
    resetDebouncedFromTokenValue,
    setUserClickedMax
  ])

  const prevFromRef = useRef(fromToken)
  const prevToRef = useRef(toToken)

  useEffect(() => {
    function clearSameToken(): void {
      if (
        !(
          fromToken &&
          toToken &&
          fromToken.internalId === toToken.internalId &&
          fromToken.networkChainId === toToken.networkChainId
        )
      ) {
        return
      }

      if (prevFromRef.current !== fromToken) {
        setToToken(undefined)
      } else if (prevToRef.current !== toToken) {
        setFromToken(undefined)
      }

      setAmount(undefined)
      setToTokenValue(undefined)
      setFromTokenValue(undefined)

      prevFromRef.current = fromToken
      prevToRef.current = toToken
    }

    function autoSelectBtcb(): void {
      const fromIsBtc = fromToken?.internalId === tokenIds.BTC

      if (!fromIsBtc) return

      // Skip if TO is already BTC.b — avoids overriding a valid selection
      // or causing unnecessary state writes on re-renders.
      const btcBTokenId = isDeveloperMode ? tokenIds.BTC_B_FUJI : tokenIds.BTC_B
      const toIsBtcB = toToken?.internalId === btcBTokenId
      if (toIsBtcB) return

      const btcb = [btcBLocalToken, ...tokensWithZeroBalance].find(
        tk => tk?.internalId === btcBTokenId
      )
      if (btcb) setToToken(btcb)
    }

    clearSameToken()
    // auto select BTC.b needs to run after clearSameToken so the auto-select can
    // override any same-token clear (e.g. BTC.b→BTC then switching FROM to BTC).
    autoSelectBtcb()
  }, [
    fromToken,
    toToken,
    setToToken,
    setFromToken,
    setAmount,
    tokensWithZeroBalance,
    btcBLocalToken,
    isDeveloperMode
  ])

  // Validate token pair compatibility - clear TO token if incompatible with FROM chain
  const { isValidDestination } = useSupportedChains()

  useEffect(() => {
    // Skip if either token missing
    if (!fromToken || !toToken) return

    // Check if TO token's network is valid for FROM chain
    const isValid = isValidDestination(
      fromToken.networkChainId,
      toToken.networkChainId
    )

    if (!isValid) {
      // Clear incompatible TO token
      setToToken(undefined)
      setValidationError(
        fusionErrors.incompatibleNetworks(fromToken.symbol, toToken.symbol)
      )
    } else {
      // Clear error if tokens are compatible
      setValidationError(null)
    }
  }, [fromToken, toToken, isValidDestination, setToToken])

  useEffect(() => {
    if (!debouncedFromTokenValue) {
      setToTokenValue(undefined)
    }
  }, [debouncedFromTokenValue])

  usePreventScreenRemoval(isSwapping)

  const renderError = useCallback(() => {
    if (!activeError) return null

    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={{
          alignItems: 'center',
          marginVertical: 8,
          width: '85%',
          alignSelf: 'center'
        }}>
        <Text
          testID="error_msg"
          variant="caption"
          sx={{ color: '$textDanger', textAlign: 'center' }}>
          {activeError.message}
        </Text>
      </Animated.View>
    )
  }, [activeError])

  const renderAdditiveFeesNotice = useCallback(() => {
    if (
      !fromToken ||
      !activeQuote ||
      activeError ||
      (liveBufferedAdditiveFee === 0n && liveBufferedNativeAdditiveFee === 0n)
    ) {
      return null
    }
    return (
      <AdditiveFeesNotice
        fee={liveBufferedAdditiveFee}
        fromToken={fromToken}
        nativeFee={liveBufferedNativeAdditiveFee}
        nativeFromToken={nativeFromToken}
      />
    )
  }, [
    fromToken,
    activeQuote,
    activeError,
    liveBufferedAdditiveFee,
    liveBufferedNativeAdditiveFee,
    nativeFromToken
  ])

  const renderPartnerFee = useCallback(() => {
    if (corePhrase === undefined) return null
    return (
      <Text
        variant="caption"
        sx={{
          marginTop: 12,
          alignSelf: 'center',
          textAlign: 'center',
          paddingHorizontal: 16
        }}>
        {`Quote includes ${corePhrase}`}
      </Text>
    )
  }, [corePhrase])

  const renderLombardLogo = useCallback(() => {
    return (
      <View
        sx={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 4,
          marginBottom: 8,
          opacity: 0.4
        }}>
        <Text variant="caption" sx={{ marginRight: -14 }}>
          {'Powered by'}
        </Text>
        {theme.isDark ? (
          <LombardWordmarkDark width={120} height={40} />
        ) : (
          <LombardWordmarkLight width={120} height={40} />
        )}
      </View>
    )
  }, [theme.isDark])

  const showCctTwoTxNotice = shouldShowAvalancheCctTwoTxNotice({
    quote: activeQuote,
    isSeedlessWallet
  })

  const isRecurringReady =
    recurring.isRecurring &&
    !!recurring.frequency &&
    recurring.numberOfOrders !== undefined &&
    !!fromToken &&
    !!toToken &&
    !!fromTokenValue &&
    !!recurringQuote.data &&
    !recurringSubmitting

  const canSubmit = recurring.isRecurring ? isRecurringReady : canSwap

  // Extracted so `handleNext` stays under the cognitive-complexity bar.
  // Returns false when any guard fails — caller does not advance.
  // eslint-disable-next-line sonarjs/cognitive-complexity -- chain of presence guards (recurringQuote/fromToken/toToken/etc.) drives the count over 15. Each guard is a flat boolean check; flattening into a single AND chain would be less readable.
  const submitRecurring = useCallback(async (): Promise<boolean> => {
    if (!recurringQuote.data || !activeAccount || !activeAccount.addressC)
      return false
    if (!fromToken || !toToken) return false
    if (!('decimals' in fromToken) || !('decimals' in toToken)) return false
    if (!recurring.frequency || recurring.numberOfOrders === undefined)
      return false
    if (fromTokenValue === undefined) return false
    // The SDK's `executeFirstFill` needs a full `Chain` for the source
    // network — `toChain` reads CAIP-2 chainId, rpcUrl, networkToken, and
    // multicall off the active Avalanche EVM network from Redux.
    const fromNetwork = getNetwork(fromToken.networkChainId)
    if (!fromNetwork) return false
    let sourceChain
    try {
      sourceChain = toChain(fromNetwork)
    } catch (err) {
      Logger.error('[RecurringSwap] toChain failed', err)
      return false
    }

    setRecurringSubmitting(true)
    try {
      await submitRecurringSwap({
        quote: recurringQuote.data,
        fromAddress: activeAccount.addressC,
        sourceChain,
        fromTokenSymbol: fromToken.symbol,
        fromTokenDecimals: fromToken.decimals,
        toTokenSymbol: toToken.symbol,
        frequency: recurring.frequency,
        numberOfOrders: recurring.numberOfOrders,
        amountPerOrder: fromTokenValue,
        // Threaded through so submitRecurringSwap can target its
        // quote-expiry / SDK-rejection invalidations at the exact cached
        // quote, not every recurring quote in the app.
        fromTokenLocalId: fromToken.localId,
        toTokenLocalId: toToken.localId,
        fromTokenNetworkChainId: fromToken.networkChainId,
        toTokenNetworkChainId: toToken.networkChainId,
        slippageBps: recurringSlippageBps
      })
      // submitRecurringSwap fires the success snackbar + analytics +
      // staggered query invalidations on its own (the SDK call's resolution
      // is the success signal; no Redux listener in between). Dismiss the
      // modal stack so the user lands back where they came from.
      dismissAll()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // User-rejection errors from the signer bubble up untouched. They're
      // not a bug — they're the user explicitly tapping Reject. Suppress
      // both the failure toast AND the Logger.error (which pipes to
      // Sentry) so rejections don't pollute the error telemetry.
      if (/User (rejected|cancel(l|led))/i.test(message)) {
        Logger.info('[RecurringSwap] submitRecurringSwap user-rejected')
      } else if (isInvalidParamsError(err)) {
        // Quote expired / sourceChain mismatch — surface a recoverable
        // hint instead of the generic "try again" copy.
        Logger.error('[RecurringSwap] submitRecurringSwap threw', err)
        showSnackbar('Quote expired — please re-confirm and try again')
      } else {
        Logger.error('[RecurringSwap] submitRecurringSwap threw', err)
        showSnackbar('Recurring swap failed — please try again')
      }
    } finally {
      setRecurringSubmitting(false)
    }
    return false
  }, [
    recurringQuote.data,
    activeAccount,
    fromToken,
    toToken,
    recurring.frequency,
    recurring.numberOfOrders,
    fromTokenValue,
    getNetwork,
    dismissAll
  ])

  const handleNext = useCallback(() => {
    if (recurring.isRecurring) {
      void submitRecurring()
      return
    }
    handleSwap()
  }, [recurring.isRecurring, submitRecurring, handleSwap])

  const renderFooter = useCallback(() => {
    const isBusy = isSwapping || recurringSubmitting
    return (
      <>
        {isLombard && renderLombardLogo()}
        <Button
          testID={!canSubmit || isBusy ? 'next_btn_disabled' : 'next_btn'}
          type="primary"
          size="large"
          onPress={handleNext}
          disabled={!canSubmit || isBusy}>
          {isBusy ? <ActivityIndicator size="small" /> : 'Next'}
        </Button>
      </>
    )
  }, [
    canSubmit,
    handleNext,
    isSwapping,
    recurringSubmitting,
    isLombard,
    renderLombardLogo
  ])

  const renderCctTwoTxNotice = useCallback(() => {
    if (!showCctTwoTxNotice) return null
    return (
      <View
        sx={{
          flexDirection: 'row',
          gap: 12,
          alignItems: 'center',
          marginTop: 16
        }}>
        <Icons.Alert.ErrorOutline
          color={theme.colors.$textDanger}
          width={24}
          height={24}
        />
        <Text
          sx={{
            flexShrink: 1,
            fontFamily: 'Inter-Medium',
            fontSize: 15,
            lineHeight: 20,
            letterSpacing: 0,
            color: '$textDanger'
          }}>
          This swap will require signing two transactions. One export and one
          import.
        </Text>
      </View>
    )
  }, [showCctTwoTxNotice, theme.colors.$textDanger])

  const renderFromAndToSections = useCallback(() => {
    if (isTokensLoading && !fromToken && !toToken) {
      return (
        <ActivityIndicator
          sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        />
      )
    }
    return (
      <Animated.View layout={LinearTransition}>
        {renderFromSection()}
        <View
          style={{
            backgroundColor: theme.colors.$surfaceSecondary
          }}>
          <Separator sx={{ marginHorizontal: 16 }} />
        </View>
        {renderToSection()}
      </Animated.View>
    )
  }, [
    fromToken,
    isTokensLoading,
    renderFromSection,
    renderToSection,
    theme.colors.$surfaceSecondary,
    toToken
  ])

  const decimals =
    fromToken && 'decimals' in fromToken ? fromToken.decimals : 18

  if (fusionInitError) {
    return (
      <ScrollScreen
        title="Swap"
        isModal
        contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        <ErrorState
          sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          title="Swap Unavailable"
          description={
            'Swap services failed to initialize.\nPlease try again later.'
          }
          button={{
            title: 'Go back',
            onPress: dismissOrGoBack
          }}
        />
      </ScrollScreen>
    )
  }

  return (
    <ScrollScreen
      title="Swap"
      renderFooter={renderFooter}
      isModal
      shouldAvoidKeyboard
      contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
      {/* Schedule-management entry point: surfaces above the new-swap flow so
          users with existing schedules see + manage them before entering a
          new pair. Self-hides via `count === 0` when there are none. */}
      {!isRecurringBlocked && (
        <View sx={{ marginBottom: 20 }}>
          <RecurringSchedulesBanner />
        </View>
      )}
      {renderFromAndToSections()}
      {renderAdditiveFeesNotice()}
      {renderError()}
      {/* Disclaimer banner — only when recurring is ON. Per Figma it sits
          between the swap card and the toggle. */}
      {showRecurringToggle && recurring.isRecurring && (
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 8
          }}>
          <Icons.Action.Info
            color={theme.colors.$textPrimary}
            width={20}
            height={20}
          />
          <Text variant="body2" sx={{ color: '$textPrimary', flexShrink: 1 }}>
            Swap rate is for the first swap, subsequent swaps will change
            depending on the market
          </Text>
        </View>
      )}
      {/* Recurring toggle — rendered whenever the pair is eligible, regardless
          of the on/off state (per Figma's "Recurring OFF" + "Recurring ON"
          screens). Sits above the Pricing/Slippage/Price-impact rows. */}
      {showRecurringToggle && (
        <View sx={{ marginTop: 12 }}>
          <GroupList
            data={[
              {
                title: 'Make this a recurring swap',
                value: (
                  <Toggle
                    value={recurring.isRecurring}
                    onValueChange={recurring.setIsRecurring}
                  />
                )
              }
            ]}
            separatorMarginRight={16}
          />
        </View>
      )}
      {showRecurringToggle && recurring.isRecurring && (
        <RecurringDetailsRows
          amountPerOrder={fromTokenValue}
          fromTokenSymbol={fromToken?.symbol}
          fromTokenDecimals={
            fromToken && 'decimals' in fromToken
              ? fromToken.decimals
              : undefined
          }
        />
      )}
      <View style={{ marginTop: 12 }}>
        <GroupList data={data} separatorMarginRight={16} />
        {renderPartnerFee()}
      </View>
      <FeeDebugTable
        decimals={decimals}
        maxRawGasFee={maxRawGasFee}
        maxBufferedGasFee={maxBufferedGasFee}
        maxGasSafetyBps={maxGasSafetyBps}
        liveRawGasFee={liveRawGasFee}
        liveBufferedGasFee={liveBufferedGasFee}
        maxRawAdditiveFee={maxRawAdditiveFee}
        maxBufferedAdditiveFee={maxBufferedAdditiveFee}
        maxRouteAdditiveBps={maxRouteAdditiveBps}
        liveRawAdditiveFee={liveRawAdditiveFee}
        liveBufferedAdditiveFee={liveBufferedAdditiveFee}
        liveGasSafetyBps={liveGasSafetyBps}
        liveRouteAdditiveBps={liveRouteAdditiveBps}
        maxRawNativeAdditiveFee={maxRawNativeAdditiveFee}
        maxBufferedNativeAdditiveFee={maxBufferedNativeAdditiveFee}
        liveRawNativeAdditiveFee={liveRawNativeAdditiveFee}
        liveBufferedNativeAdditiveFee={liveBufferedNativeAdditiveFee}
        nativeDecimals={
          nativeFromToken && 'decimals' in nativeFromToken
            ? nativeFromToken.decimals
            : 18
        }
      />
      {renderCctTwoTxNotice()}
    </ScrollScreen>
  )
}
