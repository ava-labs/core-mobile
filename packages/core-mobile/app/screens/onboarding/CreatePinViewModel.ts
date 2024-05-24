import { useEffect, useState } from 'react'
import { useJigglyPinIndicator } from 'utils/JigglyPinIndicatorHook'
import { Animated } from 'react-native'
import { PinKeys } from './PinKey'

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
  [PinKeys.Key0, '0']
])

export type UseCreatePinProps = {
  title: string
  pinLength: number
  onEnterChosenPin: (pinKey: PinKeys) => void
  onEnterConfirmedPin: (pinKey: PinKeys) => void
  chosenPinEntered: boolean
  validPin: string | undefined
  jiggleAnim: Animated.Value
}

export function useCreatePin(
  isResettingPin = false,
  onResetPinFailed?: () => void
): UseCreatePinProps {
  const [title, setTitle] = useState('Create Pin')
  const [chosenPin, setChosenPin] = useState('')
  const [confirmedPin, setConfirmedPin] = useState('')
  const [pinLength, setPinLength] = useState<number>(0)
  const [chosenPinEntered, setChosenPinEntered] = useState(false)
  const [confirmedPinEntered, setConfirmedPinEntered] = useState(false)
  const [validPin, setValidPin] = useState<string | undefined>(undefined)
  const { jiggleAnim, fireJiggleAnimation } = useJigglyPinIndicator()

  useEffect(() => {
    if (isResettingPin) {
      setTitle(chosenPinEntered ? 'Confirm new Pin' : 'Create new Pin')
    } else {
      setTitle(chosenPinEntered ? 'Confirm Pin' : 'Create Pin')
    }
  }, [chosenPinEntered, isResettingPin])

  function resetConfirmPinProcess(): void {
    setValidPin(undefined)
    setConfirmedPinEntered(false)
    setConfirmedPin('')
  }

  useEffect(() => {
    if (chosenPinEntered && confirmedPinEntered) {
      if (chosenPin === confirmedPin) {
        setValidPin(chosenPin)
      } else {
        onResetPinFailed?.()
        resetConfirmPinProcess()
        fireJiggleAnimation()
      }
    }
  }, [
    chosenPin,
    chosenPinEntered,
    confirmedPin,
    confirmedPinEntered,
    fireJiggleAnimation,
    onResetPinFailed
  ])

  const onEnterChosenPin = (pinKey: PinKeys): void => {
    if (pinKey === PinKeys.Backspace) {
      const pin = chosenPin.slice(0, -1)
      setPinLength(pin.length)
      setChosenPin(pin)
    } else {
      if (chosenPin.length === 6) {
        return
      }
      const newPin = chosenPin + keymap.get(pinKey)
      setPinLength(newPin.length)
      setChosenPin(newPin)
      if (newPin.length === 6) {
        setTimeout(() => {
          setPinLength(0)
          setChosenPinEntered(true)
        }, 300)
      }
    }
  }

  const onEnterConfirmedPin = (pinKey: PinKeys): void => {
    if (pinKey === PinKeys.Backspace) {
      const pin = confirmedPin.slice(0, -1)
      setPinLength(pin.length)
      setConfirmedPin(pin)
    } else {
      if (confirmedPin.length === 6) {
        return
      }
      const newPin = confirmedPin + keymap.get(pinKey)
      setPinLength(newPin.length)
      setConfirmedPin(newPin)
      if (newPin.length === 6) {
        setConfirmedPinEntered(true)
      }
    }
  }

  return {
    title,
    pinLength,
    onEnterChosenPin,
    onEnterConfirmedPin,
    chosenPinEntered,
    validPin,
    jiggleAnim
  }
}
