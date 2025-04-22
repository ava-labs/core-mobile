import { Text, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import { TextInput } from 'react-native'
import { isSlippageValid } from '../utils'

export const SlippageInput = ({
  slippage,
  setSlippage
}: {
  slippage: number
  setSlippage: (slippage: number) => void
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <TextInput
        style={{
          flex: 1,
          textAlign: 'right',
          paddingVertical: 10,
          color: theme.colors.$textSecondary,
          fontSize: 15,
          fontFamily: 'DejaVuSansMono'
        }}
        keyboardType="numeric"
        value={slippage.toString()}
        onChangeText={value => {
          const sanitizedValue = value.startsWith('.') ? '0.' : value
          isSlippageValid(sanitizedValue) &&
            setSlippage?.(Number(sanitizedValue))
        }}
      />
      <Text
        sx={{
          fontSize: 15,
          color: theme.colors.$textSecondary,
          fontFamily: 'DejaVuSansMono'
        }}>
        %
      </Text>
    </View>
  )
}
