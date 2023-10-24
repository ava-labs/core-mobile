import React, { useEffect } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import DotSVG from 'components/svg/DotSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
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
  const { theme } = useApplicationContext()
  const {
    title,
    pinDots,
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
  }, [validPin, title])

  const generatePinDots = (): Element[] => {
    const dots: Element[] = []

    pinDots.forEach((value, key) => {
      dots.push(
        <DotSVG
          fillColor={value.filled ? theme.alternateBackground : undefined}
          key={key}
        />
      )
    })
    return dots
  }

  const keyboard = (isChosenPinEntered: boolean) => {
    const keys: Element[] = []
    '123456789 0<'.split('').forEach((value, key) => {
      keys.push(
        <View key={key} style={styles.pinKey}>
          <PinKey
            keyboardKey={keymap.get(value)!}
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
          <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
            {title}
          </AvaText.LargeTitleBold>
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
        <View style={styles.dots}>{generatePinDots()}</View>
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
