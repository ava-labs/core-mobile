import React, { useCallback, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import SwapNarrowSVG from 'components/svg/SwapNarrowSVG'
import AvaButton from 'components/AvaButton'
import { useSwapContext } from 'contexts/SwapContext'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { SwapScreenProps } from 'navigation/types'
import {
  selectAvaxPrice,
  selectTokensWithBalance,
  selectTokensWithZeroBalance,
  TokenType,
  TokenWithBalance
} from 'store/balance'
import { useSelector } from 'react-redux'
import { SwapSide } from 'paraswap-core'
import { BigNumber } from 'ethers'
import BN from 'bn.js'
import { FeePreset } from 'components/NetworkFeeSelector'
import UniversalTokenSelector from 'components/UniversalTokenSelector'
import SwapTransactionDetail from 'screens/swap/components/SwapTransactionDetails'
import { usePosthogContext } from 'contexts/PosthogContext'
import { calculateRate } from 'swap/utils'
import { selectNetworkFee } from 'store/networkFee'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { calculateGasAndFees, getMaxValue } from 'utils/Utils'

type NavigationProp = SwapScreenProps<
  typeof AppNavigation.Swap.Swap
>['navigation']

export type Amount = {
  bn: BN
  amount: string
}

export default function SwapView() {
  const { capture } = usePosthogContext()
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<NavigationProp>()
  const activeNetwork = useActiveNetwork()
  const networkFee = useSelector(selectNetworkFee)
  const tokensWithBalance = useSelector(selectTokensWithBalance)
  const tokensWithZeroBalance = useSelector(selectTokensWithZeroBalance)
  const avaxPrice = useSelector(selectAvaxPrice)
  const {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    gasLimit,
    destination,
    optimalRate,
    setCustomGasLimit,
    setGasPrice,
    setDestination,
    slippage,
    setSlippage,
    setAmount,
    error: swapError,
    isFetchingOptimalRate
  } = useSwapContext()
  const [maxFromValue, setMaxFromValue] = useState<BN | undefined>()
  const [fromTokenValue, setFromTokenValue] = useState<Amount>()
  const [toTokenValue, setToTokenValue] = useState<Amount>()

  const [localError, setLocalError] = useState<string>('')
  const [customGasPrice, setCustomGasPrice] = useState<BigNumber>(
    networkFee.low
  )
  const [selectedGasFee, setSelectedGasFee] = useState<FeePreset>(
    FeePreset.Instant
  )

  const canSwap: boolean =
    !localError &&
    !swapError &&
    !!fromToken &&
    !!toToken &&
    !!optimalRate &&
    !!gasLimit &&
    !!networkFee

  useEffect(validateInputsFx, [fromTokenValue, maxFromValue])
  useEffect(applyOptimalRateFx, [optimalRate])
  useEffect(calculateGasAndMaxFx, [
    activeNetwork?.networkToken?.decimals,
    avaxPrice,
    customGasPrice,
    fromToken,
    gasLimit
  ])

  function validateInputsFx() {
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

  function applyOptimalRateFx() {
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

  function calculateGasAndMaxFx() {
    if (customGasPrice && gasLimit && fromToken?.type === TokenType.NATIVE) {
      const newFees = calculateGasAndFees({
        gasPrice: customGasPrice,
        gasLimit,
        tokenPrice: avaxPrice ?? 0,
        tokenDecimals: activeNetwork?.networkToken?.decimals
      })

      const max = getMaxValue(fromToken, newFees.fee)
      setMaxFromValue(max)
      return
    }
    setMaxFromValue(fromToken?.balance)
  }

  const swapTokens = () => {
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

  const onGasChange = useCallback(
    (limit: number, price: BigNumber, feeType: FeePreset) => {
      if (gasLimit !== limit) {
        //set custom gas limit only if differs from default
        setCustomGasLimit(limit)
      }
      setCustomGasPrice(price)
      setSelectedGasFee(feeType)
    },
    [gasLimit, setCustomGasLimit]
  )

  const maxGasPrice =
    fromToken?.type === TokenType.NATIVE && fromTokenValue
      ? fromToken.balance.sub(fromTokenValue.bn).toString()
      : tokensWithBalance
          .find(t => t.type === TokenType.NATIVE)
          ?.balance.toString() ?? '0'

  const reviewOrder = () => {
    if (optimalRate) {
      setGasPrice(customGasPrice ?? networkFee.low)
      navigate(AppNavigation.Swap.Review)
      capture('SwapReviewOrder', {
        destinationInputField: destination,
        slippageTolerance: slippage,
        customGasPrice: (customGasPrice ?? networkFee.low)?.toString()
      })
    }
  }

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
              capture('Swap_TokenSelected')
            }}
            onAmountChange={value => {
              setFromTokenValue(value)
              setDestination(SwapSide.SELL)
              setAmount(value)
            }}
            selectedToken={fromToken}
            maxAmount={
              destination === SwapSide.BUY && isFetchingOptimalRate
                ? undefined
                : maxFromValue ?? new BN(0)
            }
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
              backgroundColor: theme.colorBg2,
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
            hideMax
            onTokenChange={token => {
              const tkWithBalance = token as TokenWithBalance
              setToToken(tkWithBalance)
              capture('Swap_TokenSelected')
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
          {canSwap && (
            <SwapTransactionDetail
              fromTokenSymbol={fromToken?.symbol}
              toTokenSymbol={toToken?.symbol}
              rate={optimalRate ? calculateRate(optimalRate) : 0}
              walletFee={optimalRate?.partnerFee}
              onGasChange={onGasChange}
              gasLimit={gasLimit ?? 0}
              gasPrice={customGasPrice ?? networkFee.low}
              maxGasPrice={maxGasPrice}
              slippage={slippage}
              setSlippage={value => setSlippage(value)}
              selectedGasFee={selectedGasFee}
            />
          )}
        </>
      </ScrollView>
      <AvaButton.PrimaryLarge
        style={{ margin: 16 }}
        onPress={reviewOrder}
        disabled={!canSwap}>
        Review Order
      </AvaButton.PrimaryLarge>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})
