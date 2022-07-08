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
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useSelector } from 'react-redux'
import { SwapSide } from 'paraswap-core'
import { BigNumber } from 'ethers'
import BN from 'bn.js'
import { FeePreset } from 'components/NetworkFeeSelector'
import { calculateGasAndFees, getMaxValue, isAPIError } from 'utils/Utils'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { resolve, stringToBN } from '@avalabs/utils-sdk'
import UniversalTokenSelector from 'components/UniversalTokenSelector'
import debounce from 'lodash.debounce'
import { getTokenAddress } from 'swap/getSwapRate'
import SwapTransactionDetail from 'screens/swap/components/SwapTransactionDetails'
import { usePosthogContext } from 'contexts/PosthogContext'
import { calculateRate } from 'swap/utils'

type NavigationProp = SwapScreenProps<
  typeof AppNavigation.Swap.Swap
>['navigation']

export type Amount = {
  bn: BN
  amount: string
}

export default function SwapView() {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<NavigationProp>()
  const activeNetwork = useActiveNetwork()
  const networkFee = useNetworkFee().networkFees
  const tokensWithBalance = useSelector(selectTokensWithBalance)
  const tokensWithZeroBalance = useSelector(selectTokensWithZeroBalance)
  const avaxPrice = useSelector(selectAvaxPrice)
  const [swapError, setSwapError] = useState<{
    message: string
    hasTriedAgain?: boolean
  }>({ message: '' })
  const [swapWarning, setSwapWarning] = useState<string>()
  const [loading, setLoading] = useState(false)
  const {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    gasLimit,
    destination,
    optimalRate,
    setGasLimit,
    setGasPrice,
    setDestination,
    slippage,
    setSlippage,
    setOptimalRate,
    getRate
  } = useSwapContext()
  const [customGasPrice, setCustomGasPrice] = useState<BigNumber>(
    networkFee.low
  )
  const [gasCost, setGasCost] = useState<string>()
  const [destAmount, setDestAmount] = useState<string>('')

  const [fromTokenValue, setFromTokenValue] = useState<Amount>()
  const [toTokenValue, setToTokenValue] = useState<Amount>()
  const [maxFromValue, setMaxFromValue] = useState<BN | undefined>()
  const [defaultFromValue, setFromDefaultValue] = useState<BN>()
  const [isCalculateAvaxMax, setIsCalculateAvaxMax] = useState(false)
  const [selectedGasFee, setSelectedGasFee] = useState<FeePreset>(
    FeePreset.Instant
  )

  const calculateTokenValueToInput = useCallback(
    (
      amount: Amount,
      destinationInput: 'from' | 'to',
      sourceToken?: TokenWithBalance,
      destinationToken?: TokenWithBalance
    ) => {
      if (!sourceToken || !destinationToken) {
        return
      }
      setDestination(destinationInput)
      setLoading(true)
      debouncedHandleInputValueChanged({
        fromTokenAddress: getTokenAddress(sourceToken),
        toTokenAddress: getTokenAddress(destinationToken),
        fromTokenDecimals: sourceToken.decimals,
        toTokenDecimals: destinationToken.decimals,
        amount,
        destinationInput
      })
    },
    []
  )

  const { capture } = usePosthogContext()

  useEffect(() => {
    if (customGasPrice && gasLimit && fromToken?.type === TokenType.NATIVE) {
      const newFees = calculateGasAndFees({
        gasPrice: customGasPrice,
        gasLimit,
        tokenPrice: avaxPrice,
        tokenDecimals: activeNetwork?.networkToken?.decimals
      })
      setGasCost(newFees.fee)

      const max = getMaxValue(fromToken, newFees.fee)
      setMaxFromValue(max)
      if (!max) return

      if (isCalculateAvaxMax) {
        setFromDefaultValue(max)
        calculateTokenValueToInput(
          { bn: max, amount: max.toString() },
          'to',
          fromToken,
          toToken
        )
      }
      return
    }
    setMaxFromValue(fromToken?.balance)
  }, [
    avaxPrice,
    calculateTokenValueToInput,
    isCalculateAvaxMax,
    gasCost,
    gasLimit,
    fromToken,
    toToken,
    customGasPrice,
    destination,
    activeNetwork
  ])

  const debouncedHandleInputValueChanged = useCallback(
    debounce(
      async ({
        amount,
        toTokenAddress,
        fromTokenAddress,
        toTokenDecimals,
        fromTokenDecimals,
        destinationInput
      }) => {
        if (
          amount &&
          toTokenAddress &&
          fromTokenAddress &&
          fromTokenDecimals &&
          toTokenDecimals
        ) {
          const amountString = amount.bn.toString()
          if (amountString === '0') {
            setSwapError({ message: 'Please enter an amount' })
            setLoading(false)
            return
          }
          const swapSide =
            (destinationInput ?? destination) === 'to'
              ? SwapSide.SELL
              : SwapSide.BUY
          setLoading(true)
          try {
            const [result, error] = await resolve(
              getRate(
                fromTokenAddress,
                toTokenAddress,
                fromTokenDecimals,
                toTokenDecimals,
                amountString,
                swapSide
              )
            )

            if (error || (result && 'error' in result)) {
              throw new Error(`paraswap error message while get rate: ${error}`)
            }

            if (result) {
              if (isAPIError(result.optimalRate)) {
                throw new Error(
                  `paraswap error message while get rate: ${result.optimalRate.message}`
                )
              } else {
                // Never modify the properties of the optimalRate since the swap API needs it unchanged
                setOptimalRate(result.optimalRate)
                setGasLimit(Number(result.optimalRate.gasCost ?? 0))
                const resultAmount =
                  (destinationInput ?? destination) === 'to'
                    ? result.optimalRate.destAmount
                    : result.optimalRate.srcAmount
                setDestAmount(resultAmount)
              }
            }
          } catch (e) {
            setOptimalRate(undefined)
            setSwapError({
              message: 'Something went wrong',
              hasTriedAgain: true
            })
          } finally {
            if (!isCalculateAvaxMax) {
              setLoading(false)
            } else {
              setIsCalculateAvaxMax(false)
            }
          }
        } else {
          setOptimalRate(undefined)
        }
      },
      500
    ),
    [destination, toToken, fromToken, isCalculateAvaxMax]
  )

  function calculateSwapValue(
    selectedFromToken?: TokenWithBalance,
    selectedToToken?: TokenWithBalance
  ) {
    if (!selectedFromToken || !selectedToToken) return

    const amount = {
      amount: fromTokenValue?.amount ?? '0',
      bn: stringToBN(fromTokenValue?.amount ?? '0', toToken?.decimals ?? 18)
    }

    calculateTokenValueToInput(amount, 'to', selectedFromToken, selectedToToken)
  }

  const swapTokens = () => {
    if (
      tokensWithZeroBalance.some(
        token =>
          token.name === toToken?.name && token.symbol === toToken?.symbol
      )
    ) {
      setSwapWarning(`You don't have any ${toToken?.symbol} token for swap`)
      return
    }

    // here we swap
    const [to, from] = [fromToken, toToken]
    setFromToken(from)
    setToToken(to)
    calculateSwapValue(from, to)
  }

  const onGasChange = useCallback(
    (limit: number, price: BigNumber, feeType: FeePreset) => {
      setGasLimit(limit)
      setCustomGasPrice(price)
      setSelectedGasFee(feeType)
    },
    []
  )

  const maxGasPrice =
    fromToken?.type === TokenType.NATIVE && fromTokenValue
      ? fromToken.balance.sub(fromTokenValue.bn).toString()
      : tokensWithBalance
          .find(t => t.type === TokenType.NATIVE)
          ?.balance.toString() ?? '0'

  const canSwap: boolean =
    !swapError.message &&
    !!fromToken &&
    !!toToken &&
    !!optimalRate &&
    !!gasLimit &&
    !!networkFee

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
              setSwapWarning('')
              calculateSwapValue(tkWithBalance, toToken)
              capture('Swap_TokenSelected')
            }}
            onAmountChange={value => {
              if (value.bn.toString() === '0') {
                setSwapError({ message: 'Please enter an amount' })
                return
              }
              if (
                maxFromValue &&
                value.bn.eq(maxFromValue) &&
                fromToken?.type === TokenType.NATIVE
              ) {
                setIsCalculateAvaxMax(true)
              }
              setSwapError({ message: '' })
              setSwapWarning('')
              setFromTokenValue(value)
              calculateTokenValueToInput(value, 'to', fromToken, toToken)
            }}
            selectedToken={fromToken}
            maxAmount={
              destination === 'from' && loading
                ? undefined
                : maxFromValue ?? new BN(0)
            }
            inputAmount={
              destination === 'from'
                ? new BN(destAmount)
                : defaultFromValue || new BN(0)
            }
            hideErrorMessage
            skipHandleMaxAmount
            error={swapWarning || swapError?.message}
            isValueLoading={destination === 'from' && loading}
            onError={errorMessage => {
              setSwapError({ message: errorMessage })
            }}
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
              setSwapWarning('')
              calculateSwapValue(fromToken, tkWithBalance)
              capture('Swap_TokenSelected')
            }}
            onAmountChange={value => {
              setToTokenValue(value)
              calculateTokenValueToInput(value, 'from', fromToken, toToken)
            }}
            selectedToken={toToken}
            inputAmount={
              destination === 'to' && destAmount
                ? new BN(destAmount)
                : toTokenValue?.bn || new BN(0)
            }
            skipHandleMaxAmount
            hideErrorMessage
            isValueLoading={destination === 'to' && loading}
            onError={errorMessage => {
              setSwapError({ message: errorMessage })
            }}
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
