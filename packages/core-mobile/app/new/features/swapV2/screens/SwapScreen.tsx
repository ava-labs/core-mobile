import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  Button,
  CircularButton,
  getButtonBackgroundColor,
  GroupList,
  GroupListItem,
  Icons,
  Separator,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { TokenWithBalance } from '@avalabs/vm-module-types'
import { SwapSide } from '@paraswap/sdk'
import { useNavigation } from '@react-navigation/native'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TokenInputWidget } from 'common/components/TokenInputWidget'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { usePreventScreenRemoval } from 'common/hooks/usePreventScreenRemoval'
import { useSwapList } from 'common/hooks/useSwapList'
import { dismissKeyboardIfNeeded } from 'common/utils/dismissKeyboardIfNeeded'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import useSolanaNetwork from 'hooks/earn/useSolanaNetwork'
import { useNetworks } from 'hooks/networks/useNetworks'
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
import Logger from 'utils/Logger'
import { SwapStatus, useSwapContext } from '../contexts/SwapContext'
import { useSwapRate } from '../hooks/useSwapRate'
import { useSupportedChains } from '../hooks/useSupportedChains'
import { getDisplaySlippageValue } from '../utils/getDisplaySlippageValue'
import { ServiceType } from '../types'
import { useFusionTransfers } from '../hooks/useZustandStore'

export const SwapScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { removeTransfer } = useFusionTransfers()
  const { navigate, dismissAll } = useRouter()
  const navigation = useNavigation()

  const params = useGlobalSearchParams<{
    initialTokenIdFrom?: string
    initialTokenIdTo?: string
    retryingSwapActivityId?: string
  }>()

  const { formatCurrency } = useFormatCurrency()
  const { getMarketTokenById } = useWatchlist()

  const swapList = useSwapList()

  const {
    swap,
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    bestQuote,
    userQuote,
    allQuotes,
    isQuoteLoading,
    setDestination,
    slippage,
    autoSlippage,
    setAmount,
    quoteError,
    swapStatus
  } = useSwapContext()
  const [maxFromValue, setMaxFromValue] = useState<bigint | undefined>()
  const [fromTokenValue, setFromTokenValue] = useState<bigint>()
  const [toTokenValue, setToTokenValue] = useState<bigint>()
  const [localError, setLocalError] = useState<string>('')
  const cChainNetwork = useCChainNetwork()
  const solanaNetwork = useSolanaNetwork()
  const activeAccount = useSelector(selectActiveAccount)
  const tokensWithZeroBalance = useTokensWithZeroBalanceByNetworksForAccount(
    activeAccount,
    [cChainNetwork?.chainId, solanaNetwork?.chainId].filter(
      chainId => chainId !== undefined
    ) as number[]
  )

  const { getNetwork } = useNetworks()

  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const swapButtonBackgroundColor = useMemo(
    () => getButtonBackgroundColor('secondary', theme),
    [theme]
  )
  const errorMessage = useMemo(
    () => localError || quoteError?.message,
    [localError, quoteError]
  )

  // userQuote takes precedence over bestQuote
  const activeQuote = userQuote ?? bestQuote
  Logger.info('activeQuote', activeQuote)

  const canSwap: boolean =
    !localError && !quoteError && !!fromToken && !!toToken && !!activeQuote

  const isSwapping = swapStatus === SwapStatus.Swapping

  const coreFeeMessage = useMemo(() => {
    if (!activeQuote) return

    // Fusion SDK Quote has partnerFeeBps directly
    const feeBps = activeQuote.partnerFeeBps

    if (!feeBps) return

    return `Quote includes a ${basisPointsToPercentage(feeBps)} Core fee`
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
    if (fromTokenValue && fromTokenValue === 0n) {
      setLocalError('Please enter an amount')
    } else if (
      maxFromValue !== undefined &&
      fromTokenValue !== undefined &&
      fromTokenValue > maxFromValue
    ) {
      setLocalError('Amount exceeds available balance')
    } else {
      setLocalError('')
    }
  }, [fromTokenValue, maxFromValue])

  const applyQuote = useCallback(() => {
    if (!fromTokenValue || !activeQuote) {
      setToTokenValue(undefined)
      return
    }

    // Fusion SDK Quote has amountOut as bigint - fees are already included
    // No need to apply fee deduction - the SDK/backend handles all fees
    const amountOut = activeQuote.amountOut

    if (amountOut) {
      setToTokenValue(amountOut)
    }
  }, [activeQuote, fromTokenValue])

  const calculateMax = useCallback(() => {
    if (!fromToken) return

    setMaxFromValue(fromToken?.balance)
  }, [fromToken])

  const handleToggleTokens = useCallback(() => {
    if (
      tokensWithZeroBalance.some(
        token =>
          token.name === toToken?.name && token.symbol === toToken?.symbol
      )
    ) {
      setLocalError(`You don't have any ${toToken?.symbol} token for swap`)
      return
    }

    const [to, from] = [fromToken, toToken]
    setFromToken(from)
    setToToken(to)
    setDestination(SwapSide.SELL)
    setFromTokenValue(toTokenValue)
    setToTokenValue(undefined)
    toTokenValue && setAmount(toTokenValue)
    setMaxFromValue(undefined)
  }, [
    fromToken,
    toToken,
    setFromToken,
    setToToken,
    setDestination,
    setFromTokenValue,
    setAmount,
    toTokenValue,
    tokensWithZeroBalance
  ])

  const setInitialTokensFx = useCallback(() => {
    if (initialized.current) return

    if (params.initialTokenIdFrom || params.initialTokenIdTo) {
      initialized.current = true
    }

    let initialFromToken: LocalTokenWithBalance | undefined
    if (params?.initialTokenIdFrom) {
      initialFromToken = swapList.find(
        tk =>
          tk.localId.toLowerCase() === params.initialTokenIdFrom?.toLowerCase()
      )
    }
    setFromToken(initialFromToken)

    let initialToToken: LocalTokenWithBalance | undefined
    if (params?.initialTokenIdTo) {
      initialToToken = swapList.find(
        tk =>
          tk.localId.toLowerCase() === params.initialTokenIdTo?.toLowerCase()
      )
    }

    setToToken(initialToToken)
  }, [
    params.initialTokenIdFrom,
    params.initialTokenIdTo,
    setFromToken,
    setToToken,
    swapList
  ])

  const showFeesAndSlippage = activeQuote?.serviceType === ServiceType.MARKR

  const handleSwap = useCallback(() => {
    AnalyticsService.capture('SwapReviewOrder', {
      provider: activeQuote?.aggregator.name ?? 'Unknown',
      slippage
    })

    dismissKeyboardIfNeeded()

    // If this swap is initiated from a failed swap activity, immediately remove that
    // activity so it doesn't continue to show up in the notifications list while this
    // new swap attempt is in progress.
    params.retryingSwapActivityId &&
      removeTransfer(params.retryingSwapActivityId)

    swap()
  }, [
    swap,
    activeQuote,
    slippage,
    removeTransfer,
    params.retryingSwapActivityId
  ])

  const handleFromAmountChange = useCallback(
    (amount: bigint): void => {
      setFromTokenValue(amount)
      setDestination(SwapSide.SELL)
      setAmount(amount)
    },
    [setDestination, setAmount]
  )

  const handleToAmountChange = useCallback(
    (amount: bigint): void => {
      setToTokenValue(amount)
      setDestination(SwapSide.BUY)
      setAmount(amount)
    },
    [setDestination, setAmount]
  )

  const handleSelectFromToken = useCallback((): void => {
    const tokenParams = toToken?.networkChainId
      ? { networkChainId: toToken.networkChainId.toString() }
      : {}

    navigate({
      pathname: '/selectSwapV2FromToken',
      params: tokenParams
    })
  }, [navigate, toToken])

  const handleSelectToToken = useCallback((): void => {
    const tokenParams = fromToken?.networkChainId
      ? { networkChainId: fromToken.networkChainId.toString() }
      : {}

    navigate({
      pathname: '/selectSwapV2ToToken',
      params: tokenParams
    })
  }, [navigate, fromToken])

  const handleSelectPricingDetails = useCallback((): void => {
    navigate('/swapV2/pricingDetails')
  }, [navigate])

  const handleSelectSlippageDetails = useCallback((): void => {
    navigate('/swapV2/slippageDetails')
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

  // Track if we've already auto-focused in this session
  const hasAutoFocused = useRef(false)

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
          disabled={isSwapping}
          editable={!isSwapping}
          autoFocus={!hasAutoFocused.current} // Only auto-focus if we haven't done it yet
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
          onFocus={() => {
            setIsInputFocused(true)
            // Mark that we've auto-focused
            hasAutoFocused.current = true
          }}
          onBlur={() => setIsInputFocused(false)}
          onSelectToken={handleSelectFromToken}
          maximum={fromToken?.balance}
          valid={!localError}
        />
      </View>
    )
  }, [
    theme,
    formatInCurrency,
    handleFromAmountChange,
    handleSelectFromToken,
    getNetwork,
    fromToken,
    localError,
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

  const data = useMemo(() => {
    const items: GroupListItem[] = []

    if (!activeQuote || allQuotes.length === 0) {
      return items
    }

    const haveMultipleQuotes = allQuotes.length > 1
    if (fromToken && toToken && rate) {
      if (haveMultipleQuotes) {
        items.push({
          title: 'Pricing',
          value: `1 ${fromToken.symbol} = ${rate?.toFixed(4)} ${
            toToken.symbol
          }`,
          onPress: handleSelectPricingDetails
        })
      } else {
        items.push({
          title: 'Rate',
          value: `1 ${fromToken.symbol} = ${rate?.toFixed(4)} ${toToken.symbol}`
        })
      }
    }

    if (showFeesAndSlippage) {
      const displayValue = getDisplaySlippageValue({
        autoSlippage,
        quoteSlippageBps: activeQuote?.slippageBps,
        manualSlippage: slippage
      })
      items.push({
        title: 'Slippage',
        value: displayValue,
        onPress: isSwapping ? undefined : handleSelectSlippageDetails
      })
    }

    return items
  }, [
    fromToken,
    toToken,
    rate,
    activeQuote,
    allQuotes,
    showFeesAndSlippage,
    slippage,
    autoSlippage,
    isSwapping,
    handleSelectPricingDetails,
    handleSelectSlippageDetails
  ])

  useEffect(() => {
    if (swapStatus === SwapStatus.Success) {
      if (navigation.getParent()?.canGoBack()) {
        navigation.getParent()?.goBack()
      } else {
        dismissAll()
      }
    }
  }, [navigation, dismissAll, swapStatus])

  useEffect(validateInputs, [validateInputs])
  useEffect(applyQuote, [applyQuote])
  useEffect(calculateMax, [calculateMax])

  const initialized = useRef(false)
  useEffect(setInitialTokensFx, [setInitialTokensFx])

  const prevFromRef = useRef(fromToken)
  const prevToRef = useRef(toToken)

  useEffect(() => {
    if (fromToken && toToken && fromToken.localId === toToken.localId) {
      if (prevFromRef.current !== fromToken) {
        setToToken(undefined)
      } else if (prevToRef.current !== toToken) {
        setFromToken(undefined)
      }

      setAmount(undefined)
      setToTokenValue(undefined)
      setFromTokenValue(undefined)
    }

    prevFromRef.current = fromToken
    prevToRef.current = toToken
  }, [fromToken, toToken, setToToken, setFromToken, setAmount])

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
      setLocalError(
        `Cannot swap from ${fromToken.symbol} network to ${toToken.symbol} network. Please select a different token.`
      )
    } else {
      // Clear error if tokens are compatible
      setLocalError('')
    }
  }, [fromToken, toToken, isValidDestination, setToToken])

  useEffect(() => {
    if (!fromTokenValue) {
      setToTokenValue(undefined)
    }
  }, [fromTokenValue])

  usePreventScreenRemoval(isSwapping)

  const renderFooter = useCallback(() => {
    return (
      <Button
        testID={!canSwap || isSwapping ? 'next_btn_disabled' : 'next_btn'}
        type="primary"
        size="large"
        onPress={handleSwap}
        disabled={!canSwap || isSwapping}>
        {isSwapping ? <ActivityIndicator size="small" /> : 'Next'}
      </Button>
    )
  }, [canSwap, handleSwap, isSwapping])

  return (
    <ScrollScreen
      title="Swap"
      renderFooter={renderFooter}
      isModal
      shouldAvoidKeyboard
      contentContainerStyle={{ padding: 16 }}>
      <Animated.View layout={LinearTransition}>
        {renderFromSection()}
        <Animated.View
          style={{
            backgroundColor: theme.colors.$surfaceSecondary,
            zIndex: 100
          }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
            <Separator
              sx={{
                marginLeft: 16,
                marginRight: isInputFocused ? 0 : 20,
                flex: 1
              }}
            />
            <Separator
              sx={{
                marginLeft: isInputFocused ? 0 : 20,
                marginRight: 16,
                flex: 1
              }}
            />
          </View>
          {isInputFocused === false && (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              style={{
                position: 'absolute',
                top: -20,
                left: 0,
                right: 0
              }}>
              <CircularButton
                testID="swap_vertical_icon"
                backgroundColor={swapButtonBackgroundColor}
                style={{
                  width: 40,
                  height: 40,
                  alignSelf: 'center'
                }}
                disabled={isSwapping}
                onPress={handleToggleTokens}>
                <Icons.Custom.SwapVertical />
              </CircularButton>
            </Animated.View>
          )}
        </Animated.View>
        {renderToSection()}
      </Animated.View>

      {errorMessage && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <Text
            testID="error_msg"
            variant="caption"
            sx={{
              color: '$textDanger',
              alignSelf: 'center',
              marginVertical: 8
            }}>
            {errorMessage}
          </Text>
        </Animated.View>
      )}
      <View style={{ marginTop: 24 }}>
        <GroupList data={data} separatorMarginRight={16} />
        {coreFeeMessage !== undefined && (
          <Text variant="caption" sx={{ marginTop: 6, alignSelf: 'center' }}>
            {coreFeeMessage}
          </Text>
        )}
      </View>
    </ScrollScreen>
  )
}
