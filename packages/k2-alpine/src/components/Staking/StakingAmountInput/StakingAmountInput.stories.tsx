import React, { useMemo, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { ScrollView, Text } from '../../Primitives'
import { useTheme } from '../../..'
import { StakingAmountInput } from './StakingAmountInput'

export default {
  title: 'Staking Amount Input'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const balanceInAvax = useMemo(
    () =>
      new TokenUnit(28142000000, xpChainToken.maxDecimals, xpChainToken.symbol),
    []
  )
  const minStakeAmount = useMemo(
    () =>
      new TokenUnit(0, xpChainToken.maxDecimals, xpChainToken.symbol).add(25),
    []
  )

  const [stakeAmount, setStakeAmount] = useState<TokenUnit | undefined>()

  const handleChange = (amount: TokenUnit): void => {
    setStakeAmount(amount)
  }

  const formatInCurrency = (amount: TokenUnit): string => {
    const nativeTokenPrice = 22.0
    return `$${amount.mul(nativeTokenPrice).toDisplay({ fixedDp: 2 })} USD`
  }

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
        <StakingAmountInput
          balanceInAvax={balanceInAvax}
          minStakeAmount={minStakeAmount}
          formatInCurrency={formatInCurrency}
          onChange={handleChange}
        />
        <Text variant="body1" sx={{ alignSelf: 'center' }}>
          Amount: {stakeAmount?.toDisplay({ fixedDp: 2 })} AVAX
        </Text>
      </ScrollView>
    </GestureHandlerRootView>
  )
}

const xpChainToken = {
  maxDecimals: 9,
  symbol: 'AVAX'
}
