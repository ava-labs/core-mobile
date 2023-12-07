import React from 'react'
import { StyleSheet, TouchableNativeFeedback } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { View, Text, Icons } from '@avalabs/k2-mobile'

export enum PinKeys {
  Key1,
  Key2,
  Key3,
  Key4,
  Key5,
  Key6,
  Key7,
  Key8,
  Key9,
  Key0,
  Backspace
}

type Props = {
  keyboardKey: PinKeys
  onPress: (key: PinKeys) => void
  disabled?: boolean
}

const keymap: Map<PinKeys, string> = new Map([
  [PinKeys.Key1, '1'],
  [PinKeys.Key2, '2'],
  [PinKeys.Key3, '3'],
  [PinKeys.Key4, '4'],
  [PinKeys.Key5, '5'],
  [PinKeys.Key6, '6'],
  [PinKeys.Key7, '7'],
  [PinKeys.Key8, '8'],
  [PinKeys.Key9, '9'],
  [PinKeys.Key0, '0'],
  [PinKeys.Backspace, '<']
])

export default function PinKey({
  keyboardKey,
  onPress,
  disabled
}: Props | Readonly<Props>): JSX.Element {
  const context = useApplicationContext()
  const theme = context.theme
  const isBackspace = keyboardKey === PinKeys.Backspace
  if (keyboardKey === undefined) {
    return <View />
  }
  return (
    <TouchableNativeFeedback
      useForeground={true}
      disabled={disabled}
      onPress={() => onPress(keyboardKey)}
      background={TouchableNativeFeedback.Ripple(theme.buttonRipple, true)}>
      <View style={[styles.button, disabled && { opacity: 0.5 }]}>
        {isBackspace && <Icons.Content.IconBackspace color={theme.white} />}
        {!isBackspace && (
          <Text
            variant="heading2"
            style={{ fontSize: 36, lineHeight: 44 }}
            testID={keymap.get(keyboardKey)}>
            {keymap.get(keyboardKey)}
          </Text>
        )}
      </View>
    </TouchableNativeFeedback>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  }
})
