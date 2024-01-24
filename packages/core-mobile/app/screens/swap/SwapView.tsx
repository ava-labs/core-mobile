import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
  selectTokensWithZeroBalance,
  TokenType,
  TokenWithBalance
} from 'store/balance'
import { useSelector } from 'react-redux'
import { SwapSide } from 'paraswap-core'
import { FeePreset } from 'components/NetworkFeeSelector'
import UniversalTokenSelector from 'components/UniversalTokenSelector'
import SwapTransactionDetail from 'screens/swap/components/SwapTransactionDetails'
import { calculateRate } from 'swap/utils'
import { calculateGasAndFees, getMaxAvailableBalance } from 'utils/Utils'
import { selectActiveNetwork } from 'store/network'
import { useNetworkFee } from 'hooks/useNetworkFee'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Avax, NetworkTokenUnit } from 'types'

type NavigationProp = SwapScreenProps<
  typeof AppNavigation.Swap.Swap
>['navigation']

export default function SwapView(): JSX.Element {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<NavigationProp>()
  const activeNetwork = useSelector(selectActiveNetwork)
  const { data: networkFee } = useNetworkFee()
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
  const [maxFromValue, setMaxFromValue] = useState<
    NetworkTokenUnit | undefined
  >()
  const [fromTokenValue, setFromTokenValue] = useState<NetworkTokenUnit>()
  const [toTokenValue, setToTokenValue] = useState<NetworkTokenUnit>()
  const [isCalculatingMax, setIsCalculatingMax] = useState(false)

  const [localError, setLocalError] = useState<string>('')
  const [selectedGasFee, setSelectedGasFee] = useState<FeePreset>(
    FeePreset.Instant
  )
  const fromTokenBalance = useMemo(
    () =>
      fromToken ? NetworkTokenUnit.fromBalanceToken(fromToken) : undefined,
    [fromToken]
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
  useEffect(applyOptimalRateFx, [fromToken, optimalRate, toToken])
  useEffect(calculateGasAndMaxFx, [
    activeNetwork?.networkToken?.decimals,
    avaxPrice,
    fromToken,
    gasLimit,
    gasPrice
  ])

  function validateInputsFx(): void {
    if (fromTokenValue && fromTokenValue.isZero()) {
      setLocalError('Please enter an amount')
    } else if (
      maxFromValue &&
      fromTokenValue &&
      fromTokenValue.gt(maxFromValue)
    ) {
      setLocalError('Insufficient balance.')
    } else {
      setLocalError('')
    }
  }

  function applyOptimalRateFx(): void {
    if (optimalRate && toToken && fromToken) {
      if (optimalRate.side === SwapSide.SELL) {
        setToTokenValue(
          NetworkTokenUnit.fromBalanceToken(toToken, optimalRate.destAmount)
        )
      } else {
        setFromTokenValue(
          NetworkTokenUnit.fromBalanceToken(fromToken, optimalRate.srcAmount)
        )
      }
    }
  }

  function calculateGasAndMaxFx(): void {
    if (!fromToken) return

    if (gasPrice && gasLimit && fromToken.type === TokenType.NATIVE) {
      const newFees = calculateGasAndFees({
        maxFeePerGas: gasPrice,
        gasLimit,
        maxPriorityFeePerGas: Avax.fromBase(0),
        tokenPrice: avaxPrice ?? 0
      })

      const max = getMaxAvailableBalance(fromToken, newFees.maxTotalFee)
      setMaxFromValue(max)
      return
    }
    setMaxFromValue(NetworkTokenUnit.fromBalanceToken(fromToken))
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
    setFromTokenValue(toTokenValue)
    setToTokenValue(undefined)
    toTokenValue && setAmount(toTokenValue)
    setMaxFromValue(undefined)
  }

  const onGasChange = useCallback(
    (feePerGas: Avax, feeType: FeePreset) => {
      setGasPrice(feePerGas)
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

  const reviewOrder = (): void => {
    if (optimalRate) {
      setGasPrice(gasPrice)
      navigate(AppNavigation.Swap.Review)
      AnalyticsService.capture('SwapReviewOrder', {
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

    if (fromToken.type !== TokenType.NATIVE && fromTokenBalance) {
      // no calculations needed for non-native tokens
      setFromTokenValue(fromTokenBalance)
      setDestination(SwapSide.SELL)
      setAmount(fromTokenBalance)
      return
    }

    setIsCalculatingMax(true)
    // first let's fetch swap rates and fees for total balance amount, then we can
    // calculate max available amount for swap
    getOptimalRateForAmount(fromTokenBalance)
      .then(([{ optimalRate: optRate, error }, { customGasLimit }]) => {
        if (error) {
          setLocalError(error)
        } else if (optRate) {
          const limit = customGasLimit || parseInt(optRate.gasCost)
          const maxFees = gasPrice.mul(limit)
          let availableBalance = getMaxAvailableBalance(fromToken, maxFees)
          if (availableBalance) {
            // there's high probability that on next call swap fees will change so let's lower
            // max amount just a bit more for safety margin by chopping off some decimals
            availableBalance = availableBalance?.cut(6)
            setFromTokenValue(availableBalance)
            setDestination(SwapSide.SELL)
            setAmount(availableBalance)
          }
        }
      })
      .catch(Logger.error)
      .finally(() => {
        setIsCalculatingMax(false)
      })
  }, [
    fromToken,
    fromTokenBalance,
    gasPrice,
    getOptimalRateForAmount,
    setAmount,
    setDestination
  ])

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
            onMax={isCalculatingMax ? undefined : handleOnMax}
            onAmountChange={value => {
              setFromTokenValue(value)
              setDestination(SwapSide.SELL)
              setAmount(value)
            }}
            selectedToken={fromToken}
            inputAmount={fromTokenValue}
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
              AnalyticsService.capture('Swap_TokenSelected')
            }}
            onAmountChange={value => {
              setToTokenValue(value)
              setDestination(SwapSide.BUY)
              setAmount(value)
            }}
            selectedToken={toToken}
            inputAmount={toTokenValue}
            hideErrorMessage
            isValueLoading={
              destination === SwapSide.SELL && isFetchingOptimalRate
            }
          />
          <SwapTransactionDetail
            fromTokenSymbol={fromToken?.symbol}
            toTokenSymbol={toToken?.symbol}
            rate={optimalRate ? calculateRate(optimalRate) : 0}
            onGasChange={onGasChange}
            onGasLimitChange={onGasLimitChange}
            gasLimit={gasLimit}
            gasPrice={gasPrice}
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
