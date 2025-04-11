import { Text, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'

type TextProps = {
  keyNum: number
  text: string
}

export const MnemonicText = (
  props: TextProps | Readonly<TextProps>
): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const orderNum = (props.keyNum + 1).toString()
  return (
    <View
      style={{
        flexDirection: 'row',
        width: 100,
        height: 32,
        alignItems: 'center'
      }}
      testID="mnemonic_ava__words_view">
      <Text
        variant="body2"
        sx={{ marginEnd: 6, color: colors.$textSecondary }}
        testID={orderNum}>
        {orderNum}.
      </Text>
      <Text
        variant="body2"
        sx={{ color: colors.$textPrimary }}
        testID={`mnemonic__${orderNum}`}>
        {props.text}
      </Text>
    </View>
  )
}
