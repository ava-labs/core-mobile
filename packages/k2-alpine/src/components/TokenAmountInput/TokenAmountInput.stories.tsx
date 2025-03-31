import React, { useCallback, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { ScrollView, Text, View } from '../Primitives'
import { Icons, useTheme } from '../..'
import { TokenAmountInputWidget } from './TokenAmountInputWidget'
import { TokenAmountInput } from './TokenAmountInput'

export default {
  title: 'Token Amount Input'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  return (
    <GestureHandlerRootView
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{
          width: '100%',
          backgroundColor: theme.colors.$surfacePrimary
        }}
        contentContainerStyle={{ padding: 16, gap: 40 }}
        keyboardShouldPersistTaps="always">
        <TokenAmountInputStory />
        <StakingTokenAmountInputWidgetStory />
        <SwapTokenAmountInputWidgetStory />
      </ScrollView>
    </GestureHandlerRootView>
  )
}

const TokenAmountInputStory = (): JSX.Element => {
  const [amount, setAmount] = useState<TokenUnit | undefined>(
    new TokenUnit(1000000000, xpChainToken.maxDecimals, xpChainToken.symbol)
  )

  const handleChange = (value: TokenUnit): void => {
    setAmount(value)
  }

  return (
    <View sx={{ gap: 12 }}>
      <Text variant="heading6">Amount Input: {amount?.toString()} AVAX</Text>
      <TokenAmountInput
        amount={amount}
        token={xpChainToken}
        onChange={handleChange}
        formatInCurrency={testFormatInCurrency}
      />
    </View>
  )
}

const StakingTokenAmountInputWidgetStory = (): JSX.Element => {
  const [stakeAmount, setStakeAmount] = useState<TokenUnit | undefined>(
    new TokenUnit(25000000000, xpChainToken.maxDecimals, xpChainToken.symbol)
  )

  const handleChange = (amount: TokenUnit): void => {
    setStakeAmount(amount)
  }

  const validateStakingAmount = useCallback(async (amount: TokenUnit) => {
    if (!amount.isZero() && amount.lt(minStakeAmount)) {
      throw new Error(
        `Minimum amount to stake is ${minStakeAmount.toString()} AVAX`
      )
    } else if (amount.gt(balanceInAvax)) {
      throw new Error(
        'The specified staking amount exceeds the available balance'
      )
    }
  }, [])

  // we can't stake the full amount because of fees
  // to give a good user experience, when user presses max
  // we will stake 99.99% of the balance
  // this is to ensure that the user has enough balance to cover the fees
  const STAKING_MAX_BALANCE_PERCENTAGE = 0.9999

  return (
    <View sx={{ gap: 12 }}>
      <Text variant="heading6">
        Staking Amount Input Widget: {stakeAmount?.toString()} AVAX
      </Text>
      <TokenAmountInputWidget
        amount={stakeAmount}
        token={xpChainToken}
        balance={balanceInAvax}
        formatInCurrency={testFormatInCurrency}
        onChange={handleChange}
        maxPercentage={STAKING_MAX_BALANCE_PERCENTAGE}
        validateAmount={validateStakingAmount}
      />
    </View>
  )
}

const SwapTokenAmountInputWidgetStory = (): JSX.Element => {
  const { theme } = useTheme()
  const [swapAmount, setSwapAmount] = useState<TokenUnit | undefined>(undefined)

  const handleChange = (amount: TokenUnit): void => {
    setSwapAmount(amount)
  }

  const validateSwapAmount = useCallback(async (amount: TokenUnit) => {
    if (amount.gt(balanceInAvax)) {
      throw new Error('The specified swap amount exceeds the available balance')
    }
  }, [])

  const renderAccessory = useCallback(() => {
    return <Icons.Custom.Switch color={theme.colors.$textPrimary} />
  }, [theme])

  return (
    <View sx={{ gap: 12 }}>
      <Text variant="heading6">
        Swap Amount Input Widget: {swapAmount?.toString()} AVAX
      </Text>
      <TokenAmountInputWidget
        amount={swapAmount}
        token={ethereumToken}
        balance={balanceInAvax}
        formatInCurrency={testFormatInCurrency}
        onChange={handleChange}
        validateAmount={validateSwapAmount}
        accessory={renderAccessory()}
      />
    </View>
  )
}

const xpChainToken = {
  maxDecimals: 9,
  symbol: 'AVAX'
}

const ethereumToken = {
  maxDecimals: 18,
  symbol: 'ETH'
}

const testFormatInCurrency = (amount: TokenUnit): string => {
  const nativeTokenPrice = 22.0
  return `$${amount.mul(nativeTokenPrice).toDisplay({ fixedDp: 2 })} USD`
}

const balanceInAvax = new TokenUnit(
  28142000000,
  xpChainToken.maxDecimals,
  xpChainToken.symbol
)

const minStakeAmount = new TokenUnit(
  0,
  xpChainToken.maxDecimals,
  xpChainToken.symbol
).add(25)
