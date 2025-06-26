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
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition
} from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  LocalTokenWithBalance,
  selectTokensWithZeroBalanceByNetwork
} from 'store/balance'
import { basisPointsToPercentage } from 'utils/basisPointsToPercentage'
import { SlippageInput } from '../components.tsx/SlippageInput'
import { PARASWAP_PARTNER_FEE_BPS } from '../consts'
import { useSwapContext } from '../contexts/SwapContext'
import {
  isEvmUnwrapQuote,
  isEvmWrapQuote,
  isParaswapQuote,
  SwapType
} from '../types'
import { calculateRate as calculateEvmRate } from '../utils/evm/calculateRate'

export const SwapScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { navigate, back, canGoBack } = useRouter()
  const { getState } = useNavigation()
  const params = useGlobalSearchParams<{
    initialTokenIdFrom?: string
    initialTokenIdTo?: string
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
    destination,
    quote,
    isFetchingQuote,
    swapType,
    setSwapType,
    setDestination,
    slippage,
    setSlippage,
    setAmount,
    error: swapError,
    swapStatus
  } = useSwapContext()
  const [maxFromValue, setMaxFromValue] = useState<bigint | undefined>()
  const [fromTokenValue, setFromTokenValue] = useState<bigint>()
  const [toTokenValue, setToTokenValue] = useState<bigint>()
  const [localError, setLocalError] = useState<string>('')
  const cChainNetwork = useCChainNetwork()
  const tokensWithZeroBalance = useSelector(
    selectTokensWithZeroBalanceByNetwork(cChainNetwork?.chainId)
  )

  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const swapButtonBackgroundColor = useMemo(
    () => getButtonBackgroundColor('secondary', theme, false),
    [theme]
  )
  const errorMessage = useMemo(
    () => localError || swapError,
    [localError, swapError]
  )
  const canSwap: boolean =
    !localError && !swapError && !!fromToken && !!toToken && !!quote

  const swapInProcess = swapStatus === 'Swapping'

  const coreFeeMessage = useMemo(
    () =>
      `Quote includes a ${basisPointsToPercentage(
        PARASWAP_PARTNER_FEE_BPS
      )} Core fee`,
    []
  )

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
    if (!fromTokenValue) {
      setToTokenValue(undefined)
      return
    }

    if (quote) {
      if (isParaswapQuote(quote)) {
        if (quote.side === SwapSide.SELL) {
          setToTokenValue(BigInt(quote.destAmount))
        } else {
          setFromTokenValue(BigInt(quote.srcAmount))
        }
      } else if (isEvmWrapQuote(quote) || isEvmUnwrapQuote(quote)) {
        setToTokenValue(BigInt(quote.amount))
      }
    }
  }, [quote, fromTokenValue])

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

  const showFeesAndSlippage = useMemo(() => {
    return (quote && isParaswapQuote(quote)) || errorMessage.length
  }, [errorMessage, quote])

  const handleSwap = useCallback(() => {
    AnalyticsService.capture('SwapReviewOrder', {
      destinationInputField: destination,
      slippageTolerance: slippage
    })

    swap()
  }, [swap, destination, slippage])

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
    // @ts-ignore TODO: make routes typesafe
    navigate({ pathname: '/selectSwapFromToken' })
  }, [navigate])

  const handleSelectToToken = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate({ pathname: '/selectSwapToToken' })
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
          disabled={swapInProcess}
          editable={!swapInProcess}
          autoFocus={true}
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
          network={cChainNetwork}
          formatInCurrency={amount => formatInCurrency(fromToken, amount)}
          onAmountChange={handleFromAmountChange}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onSelectToken={handleSelectFromToken}
          maximum={fromToken?.balance}
          inputTextColor={localError ? theme.colors.$textDanger : undefined}
        />
      </View>
    )
  }, [
    theme,
    formatInCurrency,
    handleFromAmountChange,
    handleSelectFromToken,
    cChainNetwork,
    fromToken,
    localError,
    fromTokenValue,
    swapInProcess
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
          disabled={swapInProcess}
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
          network={cChainNetwork}
          formatInCurrency={amount => formatInCurrency(toToken, amount)}
          onAmountChange={handleToAmountChange}
          onSelectToken={handleSelectToToken}
          isLoadingAmount={isFetchingQuote}
        />
      </View>
    )
  }, [
    theme,
    formatInCurrency,
    handleToAmountChange,
    toToken,
    cChainNetwork,
    toTokenValue,
    isFetchingQuote,
    handleSelectToToken,
    swapInProcess
  ])

  const rate = useMemo(() => {
    // eslint-disable-next-line sonarjs/no-collapsible-if
    if (quote) {
      if (swapType === SwapType.EVM) {
        return calculateEvmRate(quote)
      }
    }

    return 0
  }, [quote, swapType])

  const data = useMemo(() => {
    const items: GroupListItem[] = []

    if (fromToken && toToken && rate) {
      items.push({
        title: 'Rate',
        value: `1 ${fromToken.symbol} = ${rate?.toFixed(4)} ${toToken.symbol}`
      })
    }

    if (showFeesAndSlippage) {
      items.push({
        title: 'Slippage tolerance',
        accessory: (
          <SlippageInput
            slippage={slippage}
            setSlippage={setSlippage}
            disabled={swapInProcess}
          />
        )
      })
    }

    return items
  }, [
    fromToken,
    toToken,
    rate,
    showFeesAndSlippage,
    slippage,
    setSlippage,
    swapInProcess
  ])

  useEffect(() => {
    setSwapType(SwapType.EVM)
  }, [setSwapType])

  useEffect(() => {
    if (swapStatus === 'Success') {
      back()
      const state = getState()
      if (state?.routes[state?.index ?? 0]?.name === 'onboarding') {
        canGoBack() && back()
      }
    }
  }, [back, canGoBack, getState, swapStatus])

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

  useEffect(() => {
    if (!fromTokenValue) {
      setToTokenValue(undefined)
    }
  }, [fromTokenValue])

  usePreventScreenRemoval(swapInProcess)

  const renderFooter = useCallback(() => {
    return (
      <Button
        testID={!canSwap || swapInProcess ? 'next_btn_disabled' : 'next_btn'}
        type="primary"
        size="large"
        onPress={handleSwap}
        disabled={!canSwap || swapInProcess}>
        {swapInProcess ? <ActivityIndicator size="small" /> : 'Next'}
      </Button>
    )
  }, [canSwap, handleSwap, swapInProcess])

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
                backgroundColor={swapButtonBackgroundColor}
                style={{
                  width: 40,
                  height: 40,
                  alignSelf: 'center'
                }}
                disabled={swapInProcess}
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
        {showFeesAndSlippage && (
          <Text variant="caption" sx={{ marginTop: 6, alignSelf: 'center' }}>
            {coreFeeMessage}
          </Text>
        )}
      </View>
    </ScrollScreen>
  )
}
