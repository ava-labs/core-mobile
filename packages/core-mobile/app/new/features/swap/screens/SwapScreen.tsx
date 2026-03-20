import LombardWordmarkDark from 'assets/icons/lombard-wordmark-dark.svg'
import LombardWordmarkLight from 'assets/icons/lombard-wordmark-light.svg'
import { formatTokenAmount } from '@avalabs/core-bridge-sdk'
import { bigintToBig, TokenUnit } from '@avalabs/core-utils-sdk'
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
import { TokenType, TokenWithBalance } from '@avalabs/vm-module-types'
import { SwapSide } from '@paraswap/sdk'
import { useNavigation } from '@react-navigation/native'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TokenInputWidget } from 'common/components/TokenInputWidget'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { usePreventScreenRemoval } from 'common/hooks/usePreventScreenRemoval'
import { dismissKeyboardIfNeeded } from 'common/utils/dismissKeyboardIfNeeded'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import useSolanaNetwork from 'hooks/earn/useSolanaNetwork'
import { useDebounce } from 'hooks/useDebounce'
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
import { tokenIds } from 'consts/tokenIds'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { useFusionTokenLookup } from '../hooks/useFusionTokenLookup'
import { SwapStatus, useSwapContext } from '../contexts/SwapContext'
import { fusionTransfersStore } from '../hooks/useZustandStore'
import { FusionQuoteError, fusionErrors } from '../utils/fusionErrors'
import { useSwapRate } from '../hooks/useSwapRate'
import { useSupportedChains } from '../hooks/useSupportedChains'
import { getDisplaySlippageValue } from '../utils/getDisplaySlippageValue'
import { ServiceType } from '../types'
import { useMaxSwapAmount } from '../hooks/useMaxSwapAmount'
import { useMinimumTransferAmount } from '../hooks/useMinimumTransferAmount'
import { useFeeValidation } from '../hooks/useFeeValidation'
import { getTokenKey } from '../utils/tokenKey'

export const SwapScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { navigate, dismissAll, push } = useRouter()
  const navigation = useNavigation()

  const params = useGlobalSearchParams<{
    initialTokenIdFrom?: string // internalId
    initialTokenIdTo?: string // internalId
    initialFromCaip2Id?: string
    initialToCaip2Id?: string
  }>()

  const { formatCurrency } = useFormatCurrency()
  const { getMarketTokenById } = useWatchlist()
  const cChainNetwork = useCChainNetwork()

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
    swapStatus,
    successTransferId
  } = useSwapContext()
  const [fromTokenValue, setFromTokenValue] = useState<bigint>()
  const [toTokenValue, setToTokenValue] = useState<bigint>()
  const [validationError, setValidationError] =
    useState<FusionQuoteError | null>(null)
  const minimumTransferAmount = useMinimumTransferAmount({ fromToken, toToken })

  const fromMaxSwapAmount = useMaxSwapAmount({
    fromToken,
    toToken,
    minimumTransferAmount
  })

  const {
    debounced: debouncedFromTokenValue,
    setValueImmediately: resetDebouncedFromTokenValue
  } = useDebounce(fromTokenValue)
  const solanaNetwork = useSolanaNetwork()
  const activeAccount = useSelector(selectActiveAccount)
  const accountTokens = useTokensWithBalanceForAccount({
    account: activeAccount
  })

  const { isTokensLoading, btcBLocalToken } = useFusionTokenLookup({
    params,
    accountTokens,
    isDeveloperMode,
    setFromToken,
    setToToken
  })

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

  // userQuote takes precedence over bestQuote
  const activeQuote = userQuote ?? bestQuote
  Logger.info('activeQuote', activeQuote)

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

  const feeValidationError = useFeeValidation({
    fromToken,
    nativeTokenBalance: nativeFromToken?.balance,
    amount: debouncedFromTokenValue,
    quote: activeQuote
  })

  const activeError = validationError ?? quoteError

  const canSwap: boolean =
    !activeError && !!fromToken && !!toToken && !!activeQuote

  const isSwapping = swapStatus === SwapStatus.Swapping

  const coreFeeMessage = useMemo(() => {
    if (!activeQuote) return

    // Fusion SDK Quote has partnerFeeBps directly
    const feeBps = activeQuote.partnerFeeBps

    const partnerName = activeQuote.fees?.find(
      fee => fee.type === 'partner'
    )?.name

    if (!feeBps || !partnerName) return

    return `Quote includes a ${basisPointsToPercentage(feeBps)} ${partnerName}`
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
    if (fromTokenValue === undefined) {
      setValidationError(null)
      return
    }
    if (
      debouncedFromTokenValue !== undefined &&
      debouncedFromTokenValue === 0n
    ) {
      setValidationError(fusionErrors.enterAmount())
    } else if (
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
      setValidationError(fusionErrors.belowMinimumAmount(formattedMin))
    } else if (
      debouncedFromTokenValue !== undefined &&
      fromToken !== undefined &&
      debouncedFromTokenValue > fromToken.balance
    ) {
      setValidationError(fusionErrors.exceedsBalance())
    } else if (
      fromMaxSwapAmount !== undefined &&
      debouncedFromTokenValue !== undefined &&
      debouncedFromTokenValue > fromMaxSwapAmount
    ) {
      setValidationError(fusionErrors.insufficientBalanceForFees())
    } else if (feeValidationError) {
      setValidationError(feeValidationError)
    } else {
      setValidationError(null)
    }
  }, [
    fromTokenValue,
    debouncedFromTokenValue,
    minimumTransferAmount,
    fromToken,
    fromMaxSwapAmount,
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

  const handleToggleTokens = useCallback(() => {
    if (
      tokensWithZeroBalance.some(
        token =>
          token.name === toToken?.name && token.symbol === toToken?.symbol
      )
    ) {
      setValidationError(fusionErrors.noDestinationToken(toToken?.symbol ?? ''))
      return
    }

    const [to, from] = [fromToken, toToken]
    setFromToken(from)
    setToToken(to)
    setDestination(SwapSide.SELL)
    setFromTokenValue(undefined)
    setToTokenValue(undefined)
    setAmount(undefined)
  }, [
    fromToken,
    toToken,
    setFromToken,
    setToToken,
    setDestination,
    setFromTokenValue,
    setAmount,
    tokensWithZeroBalance
  ])

  const showFeesAndSlippage = activeQuote?.serviceType === ServiceType.MARKR

  const isLombard =
    activeQuote?.serviceType === ServiceType.LOMBARD_BTC_TO_BTCB ||
    activeQuote?.serviceType === ServiceType.LOMBARD_BTCB_TO_BTC

  const handleSwap = useCallback(() => {
    AnalyticsService.capture('SwapReviewOrder', {
      provider: activeQuote?.aggregator.name ?? 'Unknown',
      slippage
    })

    dismissKeyboardIfNeeded()

    swap()
  }, [swap, activeQuote, slippage])

  const handleFromAmountChange = useCallback(
    (amount: bigint): void => {
      setFromTokenValue(amount)
      setDestination(SwapSide.SELL)
    },
    [setDestination]
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
    dismissKeyboardIfNeeded()

    const tokenParams = fromToken?.networkChainId
      ? { networkChainId: fromToken.networkChainId.toString() }
      : {}

    navigate({
      pathname: '/selectSwapFromToken',
      params: tokenParams
    })
  }, [navigate, fromToken])

  const handleSelectToToken = useCallback((): void => {
    dismissKeyboardIfNeeded()

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
          amountInputTestID="token_amount_input_field__you_pay"
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
          maximum={fromMaxSwapAmount}
          valid={!validationError}
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

  const data = useMemo(() => {
    const items: GroupListItem[] = []

    if (!activeQuote || allQuotes.length === 0) {
      return items
    }

    if (fromToken && toToken && rate) {
      const haveMultipleQuotes = allQuotes.length > 1
      items.push({
        title: haveMultipleQuotes ? 'Pricing' : 'Rate',
        value: `1 ${fromToken.symbol} = ${rate?.toFixed(4)} ${toToken.symbol}`,
        onPress: handleSelectPricingDetails
      })
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
      if (navigation.getParent()?.canGoBack()) {
        navigation.getParent()?.goBack()
      } else {
        dismissAll()
      }
    }
  }, [navigation, dismissAll, push, swapStatus, successTransferId])

  // Trigger quote fetch when debounced amount settles, skip if below minimum
  const syncDebouncedAmount = useCallback(() => {
    if (debouncedFromTokenValue === undefined) return
    if (
      minimumTransferAmount != null &&
      debouncedFromTokenValue > 0n &&
      debouncedFromTokenValue < minimumTransferAmount
    )
      return
    setAmount(debouncedFromTokenValue)
  }, [debouncedFromTokenValue, minimumTransferAmount, setAmount])

  useEffect(validateInputs, [validateInputs])
  useEffect(applyQuote, [applyQuote])
  useEffect(syncDebouncedAmount, [syncDebouncedAmount])

  // Reset from amount when the user selects a different from token.
  const prevFromTokenKeyRef = useRef(
    fromToken ? getTokenKey(fromToken) : undefined
  )
  useEffect(() => {
    const key = fromToken ? getTokenKey(fromToken) : undefined
    const prevKey = prevFromTokenKeyRef.current
    prevFromTokenKeyRef.current = key
    if (prevKey === undefined || prevKey === key) return
    setFromTokenValue(undefined)
    resetDebouncedFromTokenValue(undefined)
    setAmount(undefined)
  }, [fromToken, setFromTokenValue, setAmount, resetDebouncedFromTokenValue])

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
      const toIsBtcB = toToken?.internalId === tokenIds.BTC_B
      if (toIsBtcB) return

      const btcb = [btcBLocalToken, ...tokensWithZeroBalance].find(
        tk => tk?.internalId === tokenIds.BTC_B
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
    btcBLocalToken
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

  const renderPartnerFee = useCallback(() => {
    if (coreFeeMessage === undefined) return null
    return (
      <Text variant="caption" sx={{ marginTop: 6, alignSelf: 'center' }}>
        {coreFeeMessage}
      </Text>
    )
  }, [coreFeeMessage])

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

  const renderFooter = useCallback(() => {
    return (
      <>
        {isLombard && renderLombardLogo()}
        <Button
          testID={!canSwap || isSwapping ? 'next_btn_disabled' : 'next_btn'}
          type="primary"
          size="large"
          onPress={handleSwap}
          disabled={!canSwap || isSwapping}>
          {isSwapping ? <ActivityIndicator size="small" /> : 'Next'}
        </Button>
      </>
    )
  }, [canSwap, handleSwap, isSwapping, isLombard, renderLombardLogo])

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
    )
  }, [
    fromToken,
    handleToggleTokens,
    isInputFocused,
    isTokensLoading,
    isSwapping,
    renderFromSection,
    renderToSection,
    swapButtonBackgroundColor,
    theme.colors.$surfaceSecondary,
    toToken
  ])

  return (
    <ScrollScreen
      title="Swap"
      renderFooter={renderFooter}
      isModal
      shouldAvoidKeyboard
      contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
      {renderFromAndToSections()}
      {renderError()}
      <View style={{ marginTop: 24 }}>
        <GroupList data={data} separatorMarginRight={16} />
        {renderPartnerFee()}
      </View>
    </ScrollScreen>
  )
}
