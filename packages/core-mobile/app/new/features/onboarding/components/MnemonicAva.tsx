import React from 'react'
import { StyleSheet } from 'react-native'
import { useTheme, View, Text } from '@avalabs/k2-alpine'

type TextProps = {
  keyNum: number
  text: string
}

function MnemonicText(props: TextProps | Readonly<TextProps>): JSX.Element {
  const { theme } = useTheme()
  const orderNum = (props.keyNum + 1).toString()
  return (
    <View style={styles.horizontalLayout} testID="mnemonic_ava__words_view">
      <Text
        variant="body2"
        sx={{ marginEnd: 6, color: theme.colors.$textSecondary }}
        testID={orderNum}>
        {orderNum}.
      </Text>
      <Text
        variant="body2"
        sx={{ color: theme.colors.$textPrimary }}
        testID={`mnemonic__${orderNum}`}>
        {props.text}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100
  }
})

const MnemonicAva = {
  Text: MnemonicText
}

export default MnemonicAva
