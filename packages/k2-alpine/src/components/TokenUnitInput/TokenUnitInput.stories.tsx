import React, { useCallback, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { ScrollView, Text, View } from '../Primitives'
import { Button, Icons, useTheme } from '../..'
import { TokenUnitInputWidget } from './TokenUnitInputWidget'
import { TokenUnitInput } from './TokenUnitInput'
import { SendTokenUnitInputWidget } from './SendTokenUnitInputWidget'

export default {
  title: 'Token Unit Input'
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
        <TokenUnitInputStory />
        <StakingTokenUnitInputWidgetStory />
        <SwapTokenUnitInputWidgetStory />
        <SendTokenUnitInputWidgetStory />
      </ScrollView>
    </GestureHandlerRootView>
  )
}

const TokenUnitInputStory = (): JSX.Element => {
  const [amount, setAmount] = useState<TokenUnit | undefined>(
    new TokenUnit(1000000000, xpChainToken.maxDecimals, xpChainToken.symbol)
  )

  const handleChange = (value: TokenUnit): void => {
    setAmount(value)
  }

  return (
    <View sx={{ gap: 12 }}>
      <Text variant="heading6">Amount Input: {amount?.toString()} AVAX</Text>
      <TokenUnitInput
        amount={amount}
        token={xpChainToken}
        onChange={handleChange}
        formatInCurrency={testFormatInCurrency}
      />
    </View>
  )
}

const StakingTokenUnitInputWidgetStory = (): JSX.Element => {
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
      <TokenUnitInputWidget
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

const SwapTokenUnitInputWidgetStory = (): JSX.Element => {
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
      <TokenUnitInputWidget
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

const SendTokenUnitInputWidgetStory = (): JSX.Element => {
  const { theme } = useTheme()
  const [sendAmount, setSendAmount] = useState<TokenUnit>()
  const [availabelBalance, setAvailableBalance] =
    useState<TokenUnit>(balanceInAvax)
  const handleChange = (amount: TokenUnit): void => {
    setSendAmount(amount)
  }

  const validateSendAmount = useCallback(
    async (amount: TokenUnit) => {
      if (amount.gt(availabelBalance)) {
        throw new Error(
          'The specified send amount exceeds the available balance'
        )
      }
    },
    [availabelBalance]
  )

  const renderAccessory = useCallback(() => {
    return <Icons.Custom.Switch color={theme.colors.$textPrimary} />
  }, [theme])

  return (
    <View sx={{ gap: 12 }}>
      <Text variant="heading6">
        Send Amount Input Widget: {sendAmount?.toString()} AVAX
      </Text>

      <View sx={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Text variant="body1" sx={{ color: '$textPrimary' }}>
          Set available balances:
        </Text>
        {BalancesInAvax.map((balance, index) => (
          <Button
            size="small"
            type="secondary"
            key={index}
            style={{ width: 40 }}
            onPress={() => setAvailableBalance(balance)}>
            {balance.toString()}
          </Button>
        ))}
      </View>

      <SendTokenUnitInputWidget
        amount={sendAmount}
        token={xpChainToken}
        balance={availabelBalance}
        formatInCurrency={testFormatInCurrency}
        onChange={handleChange}
        validateAmount={validateSendAmount}
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

const BalancesInAvax = [
  new TokenUnit(1000000000, xpChainToken.maxDecimals, xpChainToken.symbol),
  new TokenUnit(6000000000, xpChainToken.maxDecimals, xpChainToken.symbol),
  new TokenUnit(11000000000, xpChainToken.maxDecimals, xpChainToken.symbol),
  new TokenUnit(125000000000, xpChainToken.maxDecimals, xpChainToken.symbol)
]
