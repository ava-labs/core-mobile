import React, { useEffect } from 'react'
import { Animated, StyleSheet } from 'react-native'
import { View, Text } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import { PinDots } from 'screens/login/PinDots'
import { useCreatePin } from './CreatePinViewModel'
import PinKey, { PinKeys } from './PinKey'

const keymap: Map<string, PinKeys> = new Map([
  ['1', PinKeys.Key1],
  ['2', PinKeys.Key2],
  ['3', PinKeys.Key3],
  ['4', PinKeys.Key4],
  ['5', PinKeys.Key5],
  ['6', PinKeys.Key6],
  ['7', PinKeys.Key7],
  ['8', PinKeys.Key8],
  ['9', PinKeys.Key9],
  ['0', PinKeys.Key0],
  ['<', PinKeys.Backspace]
])

type Props = {
  onPinSet: (pin: string) => void
  onResetPinFailed?: () => void
  isResettingPin?: boolean
}

/**
 * This screen will prompt user for PIN creation and confirmation, and upon success onPinSet will be called.
 * @param onBack
 * @param onPinSet
 * @param onResetPinFailed
 * @param isResettingPin
 * @constructor
 */
export default function CreatePIN({
  onPinSet,
  isResettingPin,
  onResetPinFailed
}: Props): JSX.Element {
  const {
    title,
    pinLength,
    onEnterChosenPin,
    onEnterConfirmedPin,
    chosenPinEntered,
    validPin,
    jiggleAnim
  } = useCreatePin(isResettingPin, onResetPinFailed)

  useEffect(() => {
    if (validPin) {
      onPinSet(validPin)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validPin, title])

  const keyboard = (isChosenPinEntered: boolean): JSX.Element[] => {
    const keys: JSX.Element[] = []
    '123456789 0<'.split('').forEach((value, key) => {
      keys.push(
        <View key={key} style={styles.pinKey}>
          <PinKey
            keyboardKey={keymap.get(value)}
            onPress={
              isChosenPinEntered ? onEnterConfirmedPin : onEnterChosenPin
            }
          />
        </View>
      )
    })
    return keys
  }

  return (
    <View style={[styles.verticalLayout]}>
      {isResettingPin || (
        <>
          <Text variant="heading3" style={{ marginHorizontal: 16 }}>
            {title}
          </Text>
          <Space y={20} />
        </>
      )}
      <Animated.View
        style={[
          { padding: 68, flexGrow: 1 },
          {
            transform: [
              {
                translateX: jiggleAnim
              }
            ]
          }
        ]}>
        <View style={styles.dots}>
          <PinDots pinLength={pinLength} />
        </View>
      </Animated.View>
      <View style={styles.keyboard}>{keyboard(chosenPinEntered)}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  verticalLayout: {
    height: '100%',
    justifyContent: 'flex-end'
  },
  growContainer: {
    flexGrow: 1
  },
  keyboard: {
    marginHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  dots: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexDirection: 'row'
  },
  pinKey: {
    flexBasis: '33%',
    padding: 16
  }
})
