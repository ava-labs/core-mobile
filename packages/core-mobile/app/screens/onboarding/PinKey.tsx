import React from 'react'
import {
  StyleSheet,
  TouchableNativeFeedback,
  Platform,
  Pressable
} from 'react-native'
import { View, Text, Icons, alpha, useTheme } from '@avalabs/k2-mobile'
import { K2Theme } from '@avalabs/k2-mobile/src/theme/theme'

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
  keyboardKey: PinKeys | undefined
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

const getHighlighColor = (theme: K2Theme): string => {
  return alpha(theme.colors.$neutral800, 0.8)
}

export default function PinKey({
  keyboardKey,
  onPress,
  disabled
}: Props | Readonly<Props>): JSX.Element | null {
  const isBackspace = keyboardKey === PinKeys.Backspace
  const { theme } = useTheme()

  if (keyboardKey === undefined) return null

  const renderContent = (): JSX.Element => {
    return (
      <>
        {isBackspace && (
          <Icons.Content.IconBackspace color={theme.colors.$white} />
        )}
        {!isBackspace && (
          <Text
            variant="heading2"
            style={{ fontSize: 36, lineHeight: 44 }}
            testID={keymap.get(keyboardKey)}>
            {keymap.get(keyboardKey)}
          </Text>
        )}
      </>
    )
  }

  // simulate a circular touchable highlight effect on iOS
  if (Platform.OS === 'ios') {
    return (
      <Pressable onPress={() => onPress(keyboardKey)} disabled={disabled}>
        {({ pressed }) => (
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <View style={styles.button}>{renderContent()}</View>
            <View
              style={{
                display: pressed ? 'flex' : 'none',
                backgroundColor: getHighlighColor(theme),
                position: 'absolute',
                width: 74,
                height: 74,
                borderRadius: 37
              }}
            />
          </View>
        )}
      </Pressable>
    )
  }

  return (
    <TouchableNativeFeedback
      useForeground={true}
      disabled={disabled}
      onPress={() => onPress(keyboardKey)}
      background={TouchableNativeFeedback.Ripple(
        theme.colors.$neutral800,
        true
      )}>
      <View style={[styles.button, disabled && { opacity: 0.5 }]}>
        {renderContent()}
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
