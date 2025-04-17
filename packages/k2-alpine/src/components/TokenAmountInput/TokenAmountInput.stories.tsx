import React, { useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ScrollView, Text, View } from '../Primitives'
import { useTheme } from '../..'
import { TokenAmount, TokenAmountInput } from './TokenAmountInput'

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
        <TokenUnitInputStory />
      </ScrollView>
    </GestureHandlerRootView>
  )
}

const TokenUnitInputStory = (): JSX.Element => {
  const [amount, setAmount] = useState<TokenAmount>()

  const handleChange = (value: TokenAmount): void => {
    setAmount(value)
  }

  return (
    <View sx={{ gap: 12 }}>
      <Text variant="heading6">Amount Input: {amount?.valueString} AVAX</Text>
      <TokenAmountInput
        value={amount?.value}
        denomination={xpChainToken.maxDecimals}
        onChange={handleChange}
        placeholder="0.00"
        style={{
          fontFamily: 'Aeonik-Medium',
          fontSize: 60
        }}
      />
    </View>
  )
}

const xpChainToken = {
  maxDecimals: 9,
  symbol: 'AVAX'
}
