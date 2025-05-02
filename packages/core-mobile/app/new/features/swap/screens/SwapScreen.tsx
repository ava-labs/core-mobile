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
import { TokenType, TokenWithBalance } from '@avalabs/vm-module-types'
import { SwapSide } from '@paraswap/sdk'
import { useNavigation } from '@react-navigation/native'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TokenInputWidget } from 'common/components/TokenInputWidget'
import { useAvalancheErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { usePreventScreenRemoval } from 'common/hooks/usePreventScreenRemoval'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { PARASWAP_PARTNER_FEE_BPS } from 'contexts/SwapContext/consts'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
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
  selectTokensWithZeroBalance
} from 'store/balance'
import { getTokenAddress } from 'swap/getSwapRate'
import { calculateRate } from 'swap/utils'
import { basisPointsToPercentage } from 'utils/basisPointsToPercentage'
import { SlippageInput } from '../components.tsx/SlippageInput'
import { useSwapContext } from '../contexts/SwapContext'

export const SwapScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { navigate, back, canGoBack } = useRouter()
  const { getState } = useNavigation()
  const params = useGlobalSearchParams<{
    initialTokenIdFrom?: string
    initialTokenIdTo?: string
  }>()

  const { formatCurrency } = useFormatCurrency()
  const avalancheErc20ContractTokens = useAvalancheErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: avalancheErc20ContractTokens,
    hideZeroBalance: false
  })
  const tokensWithZeroBalance = useSelector(selectTokensWithZeroBalance)

  const {
    swap,
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    destination,
    optimalRate,
    setDestination,
    slippage,
    setSlippage,
    setAmount,
    error: swapError,
    isFetchingOptimalRate,
    swapStatus
  } = useSwapContext()
  const [maxFromValue, setMaxFromValue] = useState<bigint | undefined>()
  const [fromTokenValue, setFromTokenValue] = useState<bigint>()
  const [toTokenValue, setToTokenValue] = useState<bigint>()
  const [localError, setLocalError] = useState<string>('')
  const cChainNetwork = useCChainNetwork()
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
    !localError && !swapError && !!fromToken && !!toToken && !!optimalRate

  const swapInProcess = swapStatus === 'Swapping'

  const coreFeeMessage = useMemo(
    () =>
      `Quote includes a ${basisPointsToPercentage(
        PARASWAP_PARTNER_FEE_BPS
      )} Core fee`,
    []
  )

  const validateInputsFx = useCallback(() => {
    if (fromTokenValue && fromTokenValue === 0n) {
      setLocalError('Please enter an amount')
    } else if (
      maxFromValue &&
      fromTokenValue &&
      fromTokenValue > maxFromValue
    ) {
      setLocalError('Amount exceeds available balance')
    } else {
      setLocalError('')
    }
  }, [fromTokenValue, maxFromValue])

  const applyOptimalRateFx = useCallback(() => {
    if (optimalRate) {
      if (optimalRate.side === SwapSide.SELL) {
        if (fromTokenValue !== undefined) {
          setToTokenValue(BigInt(optimalRate.destAmount))
        }
      } else {
        if (toTokenValue !== undefined) {
          setFromTokenValue(BigInt(optimalRate.srcAmount))
        }
      }
    }
  }, [optimalRate, fromTokenValue, toTokenValue])

  const calculateMaxFx = useCallback(() => {
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
      initialFromToken = filteredTokenList.find(
        tk =>
          tk.localId.toLowerCase() === params.initialTokenIdFrom?.toLowerCase()
      )
    }
    setFromToken(initialFromToken)

    let initialToToken: LocalTokenWithBalance | undefined
    if (params?.initialTokenIdTo) {
      initialToToken = filteredTokenList.find(
        tk =>
          tk.localId.toLowerCase() === params.initialTokenIdTo?.toLowerCase()
      )
    }
    setToToken(initialToToken)
  }, [params, filteredTokenList, setFromToken, setToToken])

  const handleSwap = useCallback(() => {
    if (optimalRate) {
      AnalyticsService.capture('SwapReviewOrder', {
        destinationInputField: destination,
        slippageTolerance: slippage
      })

      if (fromToken && toToken && optimalRate && slippage) {
        swap({
          srcTokenAddress: getTokenAddress(fromToken),
          isSrcTokenNative: fromToken.type === TokenType.NATIVE,
          destTokenAddress: getTokenAddress(toToken),
          isDestTokenNative: toToken.type === TokenType.NATIVE,
          priceRoute: optimalRate,
          swapSlippage: slippage
        })
      }
    }
  }, [optimalRate, swap, fromToken, toToken, slippage, destination])

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
      if (token?.priceInCurrency === undefined || !('decimals' in token)) {
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
    fromTokenValue
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
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onSelectToken={handleSelectToToken}
          isLoadingAmount={isFetchingOptimalRate}
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
    isFetchingOptimalRate,
    handleSelectToToken
  ])

  const data = useMemo(() => {
    const items: GroupListItem[] = []

    const rate = optimalRate ? calculateRate(optimalRate) : 0

    if (fromToken && toToken) {
      items.push({
        title: 'Rate',
        value: isFetchingOptimalRate
          ? undefined
          : `1 ${fromToken.symbol} = ${rate?.toFixed(4)} ${toToken.symbol}`
      })
    }

    items.push({
      title: 'Slippage tolerance',
      accessory: <SlippageInput slippage={slippage} setSlippage={setSlippage} />
    })

    return items
  }, [
    toToken,
    fromToken,
    optimalRate,
    slippage,
    setSlippage,
    isFetchingOptimalRate
  ])

  useEffect(() => {
    if (swapStatus === 'Success') {
      back()
      const state = getState()
      if (state?.routes[state?.index ?? 0]?.name === 'onboarding') {
        canGoBack() && back()
      }
    }
  }, [back, canGoBack, getState, swapStatus])

  useEffect(validateInputsFx, [validateInputsFx])
  useEffect(applyOptimalRateFx, [applyOptimalRateFx])
  useEffect(calculateMaxFx, [calculateMaxFx])

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
      // TODO: remove this hard coded value
      // this is a workaround to prevent the content
      // from being pushed up too much when the keyboard appears
      bottomOffset={-2000}
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
        <Text variant="caption" sx={{ marginTop: 6, alignSelf: 'center' }}>
          {coreFeeMessage}
        </Text>
      </View>
    </ScrollScreen>
  )
}
