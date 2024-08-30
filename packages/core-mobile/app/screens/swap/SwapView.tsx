import React, { useCallback, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import SwapNarrowSVG from 'components/svg/SwapNarrowSVG'
import AvaButton from 'components/AvaButton'
import { useSwapContext } from 'contexts/SwapContext/SwapContext'
import { selectTokensWithZeroBalance } from 'store/balance/slice'
import { useSelector } from 'react-redux'
import { SwapSide } from '@paraswap/sdk'
import UniversalTokenSelector from 'components/UniversalTokenSelector'
import SwapTransactionDetail from 'screens/swap/components/SwapTransactionDetails'
import { calculateRate } from 'swap/utils'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Amount } from 'types'
import { bigIntToString } from '@avalabs/core-utils-sdk'
import { getTokenAddress } from 'swap/getSwapRate'
import { SwapScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useTheme } from '@avalabs/k2-mobile'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { TokenType, TokenWithBalance } from '@avalabs/vm-module-types'

type NavigationProps = SwapScreenProps<typeof AppNavigation.Swap.Swap>

export default function SwapView(): JSX.Element {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { theme } = useTheme()
  const { params } = useRoute<NavigationProps['route']>()
  const { filteredTokenList } = useSearchableTokenList()
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
  const [fromTokenValue, setFromTokenValue] = useState<Amount>()
  const [toTokenValue, setToTokenValue] = useState<Amount>()

  const [localError, setLocalError] = useState<string>('')

  const canSwap: boolean =
    !localError && !swapError && !!fromToken && !!toToken && !!optimalRate

  const swapInProcess = swapStatus === 'Swapping'

  useEffect(() => {
    if (swapStatus === 'Success') {
      navigation.getParent()?.goBack()
    }
  }, [navigation, swapStatus])

  useEffect(validateInputsFx, [fromTokenValue, maxFromValue])
  useEffect(applyOptimalRateFx, [optimalRate])
  useEffect(calculateMaxFx, [fromToken])
  useEffect(() => {
    if (params?.initialTokenId) {
      const token = filteredTokenList.find(
        tk => tk.localId === params.initialTokenId
      )
      if (token) {
        setFromToken(token)
      }
    }
  }, [params, filteredTokenList, setFromToken])

  function validateInputsFx(): void {
    if (fromTokenValue && fromTokenValue.bn === 0n) {
      setLocalError('Please enter an amount')
    } else if (
      maxFromValue &&
      fromTokenValue &&
      fromTokenValue.bn > maxFromValue
    ) {
      setLocalError('Insufficient balance.')
    } else {
      setLocalError('')
    }
  }

  function applyOptimalRateFx(): void {
    if (optimalRate) {
      if (optimalRate.side === SwapSide.SELL) {
        setToTokenValue({
          bn: BigInt(optimalRate.destAmount),
          amount: optimalRate.destAmount
        })
      } else {
        setFromTokenValue({
          bn: BigInt(optimalRate.srcAmount),
          amount: optimalRate.srcAmount
        })
      }
    }
  }

  function calculateMaxFx(): void {
    if (!fromToken) return

    setMaxFromValue(fromToken?.balance)
  }

  const swapTokens = (): void => {
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
    setFromTokenValue(toTokenValue ? { ...toTokenValue } : undefined)
    setToTokenValue(undefined)
    toTokenValue && setAmount(toTokenValue)
    setMaxFromValue(undefined)
  }

  const reviewOrder = (): void => {
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
  }

  const handleOnMax = useCallback(() => {
    if (!fromToken) {
      return
    }

    const totalBalance = {
      bn: fromToken.balance,
      amount: bigIntToString(fromToken.balance, fromToken?.decimals)
    } as Amount

    // no calculations needed for non-native tokens
    setFromTokenValue(totalBalance)
    setDestination(SwapSide.SELL)
    setAmount(totalBalance)
  }, [fromToken, setAmount, setDestination])

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
          Swap
        </AvaText.LargeTitleBold>
        <>
          <Space y={20} />

          <UniversalTokenSelector
            label={'From'}
            hideZeroBalanceTokens
            onTokenChange={token => {
              const tkWithBalance = token as TokenWithBalance
              setFromToken(tkWithBalance)
              AnalyticsService.capture('Swap_TokenSelected')
            }}
            onMax={handleOnMax}
            onAmountChange={value => {
              setFromTokenValue(value)
              setDestination(SwapSide.SELL)
              setAmount(value)
            }}
            selectedToken={fromToken}
            inputAmount={fromTokenValue?.bn}
            hideErrorMessage
            error={localError || swapError}
            isValueLoading={
              destination === SwapSide.BUY && isFetchingOptimalRate
            }
          />
          <Space y={20} />
          <AvaButton.Base
            onPress={swapTokens}
            style={{
              alignSelf: 'flex-end',
              borderRadius: 50,
              backgroundColor: theme.colors.$neutral900,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              marginHorizontal: 16
            }}>
            <SwapNarrowSVG />
          </AvaButton.Base>
          <Space y={20} />
          <UniversalTokenSelector
            label={'To'}
            onTokenChange={token => {
              const tkWithBalance = token as TokenWithBalance
              setToToken(tkWithBalance)
              AnalyticsService.capture('Swap_TokenSelected')
            }}
            onAmountChange={value => {
              setToTokenValue(value)
              setDestination(SwapSide.BUY)
              setAmount(value)
            }}
            selectedToken={toToken}
            inputAmount={toTokenValue?.bn}
            hideErrorMessage
            isValueLoading={
              destination === SwapSide.SELL && isFetchingOptimalRate
            }
          />
          <SwapTransactionDetail
            fromTokenSymbol={fromToken?.symbol}
            toTokenSymbol={toToken?.symbol}
            rate={optimalRate ? calculateRate(optimalRate) : 0}
            slippage={slippage}
            setSlippage={value => setSlippage(value)}
          />
        </>
      </ScrollView>
      <AvaButton.PrimaryLarge
        testID={
          !canSwap || swapInProcess
            ? 'disabled_review_order_button'
            : 'review_order_button'
        }
        style={{ margin: 16 }}
        onPress={reviewOrder}
        disabled={!canSwap || swapInProcess}>
        {!swapInProcess ? 'Review Order' : 'Swapping...'}
      </AvaButton.PrimaryLarge>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})
