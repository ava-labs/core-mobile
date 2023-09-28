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
import BN from 'bn.js'
import { FeePreset } from 'components/NetworkFeeSelector'
import UniversalTokenSelector from 'components/UniversalTokenSelector'
import SwapTransactionDetail from 'screens/swap/components/SwapTransactionDetails'
import { calculateRate } from 'swap/utils'
import { calculateGasAndFees, getMaxValue, truncateBN } from 'utils/Utils'
import { bnToLocaleString } from '@avalabs/utils-sdk'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { selectActiveNetwork } from 'store/network'
import { useNetworkFee } from 'hooks/useNetworkFee'
import Logger from 'utils/Logger'

type NavigationProp = SwapScreenProps<
  typeof AppNavigation.Swap.Swap
>['navigation']

export type Amount = {
  bn: BN
  amount: string
}

export default function SwapView() {
  const { capture } = usePostCapture()
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<NavigationProp>()
  const activeNetwork = useSelector(selectActiveNetwork)
  const { data: networkFee } = useNetworkFee()
  const tokensWithBalance = useSelector(selectTokensWithBalance)
  const tokensWithZeroBalance = useSelector(selectTokensWithZeroBalance)
  const avaxPrice = useSelector(selectAvaxPrice)
  const {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    gasLimit,
    gasPrice,
    destination,
    optimalRate,
    setCustomGasLimit,
    setGasPrice,
    setDestination,
    slippage,
    setSlippage,
    setAmount,
    error: swapError,
    isFetchingOptimalRate,
    getOptimalRateForAmount
  } = useSwapContext()
  const [maxFromValue, setMaxFromValue] = useState<BN | undefined>()
  const [fromTokenValue, setFromTokenValue] = useState<Amount>()
  const [toTokenValue, setToTokenValue] = useState<Amount>()
  const [isCalculatingMax, setIsCalculatingMax] = useState(false)

  const [localError, setLocalError] = useState<string>('')
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
    fromToken,
    gasLimit,
    gasPrice
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
    if (gasPrice && gasLimit && fromToken?.type === TokenType.NATIVE) {
      const newFees = calculateGasAndFees({
        gasPrice,
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
    (price: bigint, feeType: FeePreset) => {
      setGasPrice(price)
      setSelectedGasFee(feeType)
    },
    [setGasPrice]
  )

  const onGasLimitChange = useCallback(
    (customGasLimit: number) => {
      setCustomGasLimit(customGasLimit)
    },
    [setCustomGasLimit]
  )

  const maxGasPrice =
    fromToken?.type === TokenType.NATIVE && fromTokenValue
      ? fromToken.balance.sub(fromTokenValue.bn).toString()
      : tokensWithBalance
          .find(t => t.type === TokenType.NATIVE)
          ?.balance.toString() ?? '0'

  const reviewOrder = () => {
    if (optimalRate) {
      setGasPrice(gasPrice)
      navigate(AppNavigation.Swap.Review)
      capture('SwapReviewOrder', {
        destinationInputField: destination,
        slippageTolerance: slippage,
        customGasPrice: gasPrice?.toString()
      })
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

    if (fromToken.type !== TokenType.NATIVE) {
      // no calculations needed for non-native tokens
      setFromTokenValue(totalBalance)
      setDestination(SwapSide.SELL)
      setAmount(totalBalance)
      return
    }

    setIsCalculatingMax(true)
    // first let's fetch swap rates and fees for total balance amount, then we can
    // calculate max available amount for swap
    getOptimalRateForAmount(totalBalance)
      .then(([{ optimalRate: optRate, error }, { customGasLimit }]) => {
        if (error) {
          setLocalError(error)
        } else if (optRate) {
          const limit = customGasLimit || parseInt(optRate.gasCost)
          const feeBig = gasPrice * BigInt(limit)
          const feeString = bnToLocaleString(
            new BN(feeBig.toString()),
            fromToken?.decimals
          )
          let maxBn = getMaxValue(fromToken, feeString)
          if (maxBn) {
            // there's high probability that on next call swap fees will change so let's lower
            // max amount just a bit more for safety margin by chopping off some decimals
            maxBn = truncateBN(maxBn, fromToken.decimals, 6)
            const amount = {
              bn: maxBn,
              amount: bnToLocaleString(maxBn, fromToken?.decimals)
            } as Amount
            setFromTokenValue(amount)
            setDestination(SwapSide.SELL)
            setAmount(amount)
          }
        }
      })
      .catch(Logger.error)
      .finally(() => {
        setIsCalculatingMax(false)
      })
  }, [fromToken, getOptimalRateForAmount, setDestination, setAmount, gasPrice])

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
            onMax={isCalculatingMax ? undefined : handleOnMax}
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
              isCalculatingMax ||
              (destination === SwapSide.BUY && isFetchingOptimalRate)
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
          <SwapTransactionDetail
            fromTokenSymbol={fromToken?.symbol}
            toTokenSymbol={toToken?.symbol}
            rate={optimalRate ? calculateRate(optimalRate) : 0}
            walletFee={optimalRate?.partnerFee}
            onGasChange={onGasChange}
            onGasLimitChange={onGasLimitChange}
            gasLimit={gasLimit}
            gasPrice={gasPrice}
            maxGasPrice={maxGasPrice}
            slippage={slippage}
            setSlippage={value => setSlippage(value)}
            selectedGasFee={selectedGasFee}
          />
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
