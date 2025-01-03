import React from 'react'
import { StyleSheet, TextInput } from 'react-native'
import { useTheme, View, Text } from '@avalabs/k2-alpine'

type InputProps = {
  keyNum: number
  text: string
  onChangeText?: (text: string) => void
}

function MnemonicInput(props: InputProps | Readonly<InputProps>): JSX.Element {
  const { theme } = useTheme()

  return (
    <View style={styles.horizontalLayout}>
      <Text variant="body2" sx={{ marginEnd: 4 }}>
        {(props.keyNum + 1).toString()}
      </Text>
      <TextInput
        testID="mnemonic_ava__input"
        autoCapitalize="none"
        enablesReturnKeyAutomatically={true}
        style={[
          {
            color: theme.colors.$textPrimary,
            flex: 1,
            fontSize: 16,
            borderWidth: 1,
            borderColor: theme.colors.$borderPrimary,
            padding: 4,
            borderRadius: 4,
            fontFamily: 'Inter-Regular',
            marginEnd: 4,
            marginVertical: 1
          }
        ]}
        onChangeText={props.onChangeText}
        value={props.text}
      />
    </View>
  )
}

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
        testID={`mnemonic_ava__word`}>
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
  Input: MnemonicInput,
  Text: MnemonicText
}

export default MnemonicAva
