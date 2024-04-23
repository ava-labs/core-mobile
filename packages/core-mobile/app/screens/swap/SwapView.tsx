import React, { useCallback, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import SwapNarrowSVG from 'components/svg/SwapNarrowSVG'
import AvaButton from 'components/AvaButton'
import { useSwapContext } from 'contexts/SwapContext/SwapContext'
import {
  selectTokensWithZeroBalance,
  TokenType,
  TokenWithBalance
} from 'store/balance'
import { useSelector } from 'react-redux'
import { SwapSide } from 'paraswap-core'
import UniversalTokenSelector from 'components/UniversalTokenSelector'
import SwapTransactionDetail from 'screens/swap/components/SwapTransactionDetails'
import { calculateRate } from 'swap/utils'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Amount } from 'types'
import BN from 'bn.js'
import { bnToLocaleString } from '@avalabs/utils-sdk'
import { getTokenAddress } from 'swap/getSwapRate'
import { SwapScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'

type SwapNav = SwapScreenProps<typeof AppNavigation.Swap.Swap>['navigation']

export default function SwapView(): JSX.Element {
  const navigation = useNavigation<SwapNav>()
  const { theme } = useTheme()
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
  const [maxFromValue, setMaxFromValue] = useState<BN | undefined>()
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

  function validateInputsFx(): void {
    if (fromTokenValue && fromTokenValue.bn.isZero()) {
      setLocalError('Please enter an amount')
    } else if (
      maxFromValue &&
      fromTokenValue &&
      fromTokenValue.bn.gt(maxFromValue)
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
          bn: new BN(optimalRate.destAmount),
          amount: optimalRate.destAmount
        })
      } else {
        setFromTokenValue({
          bn: new BN(optimalRate.srcAmount),
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
      amount: bnToLocaleString(fromToken.balance, fromToken?.decimals)
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
