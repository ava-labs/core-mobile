import { useCallback, useEffect, useRef, useState } from 'react'
import { getWeakPinError } from 'common/utils/weakPin'

export type UseCreatePinProps = {
  onEnterChosenPin: (pinKey: string) => void
  onEnterConfirmedPin: (pinKey: string) => void
  resetPin: () => void
  chosenPinEntered: boolean
  chosenPin: string
  confirmedPin: string
  validPin: string | undefined
  weakPinError: string | undefined
}

export function useCreatePin({
  onError
}: {
  onError: () => Promise<void>
}): UseCreatePinProps {
  const [chosenPin, setChosenPin] = useState('')
  const [confirmedPin, setConfirmedPin] = useState('')
  const [chosenPinEntered, setChosenPinEntered] = useState(false)
  const [confirmedPinEntered, setConfirmedPinEntered] = useState(false)
  const [validPin, setValidPin] = useState<string | undefined>(undefined)
  const [weakPinError, setWeakPinError] = useState<string | undefined>(
    undefined
  )
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  function resetConfirmPinProcess(): void {
    setValidPin(undefined)
    setConfirmedPinEntered(false)
    setConfirmedPin('')
  }

  const validatePin = useCallback(async () => {
    if (chosenPinEntered && confirmedPinEntered) {
      if (chosenPin === confirmedPin) {
        setValidPin(chosenPin)
      } else {
        await onError()

        resetConfirmPinProcess()
      }
    }
  }, [chosenPin, chosenPinEntered, confirmedPin, confirmedPinEntered, onError])

  useEffect(() => {
    validatePin()
  }, [validatePin])

  useEffect(() => {
    if (chosenPin.length !== 6) {
      setChosenPinEntered(false)
      return
    }
    // WSR-PHYS-002: trivially guessable PINs are rejected on creation/change
    const error = getWeakPinError(chosenPin)
    if (error) {
      setWeakPinError(error)
      onErrorRef
        .current()
        .catch(() => undefined)
        .finally(() => {
          // only clear if the user hasn't started typing a new PIN meanwhile
          setChosenPin(current => (current === chosenPin ? '' : current))
        })
      return
    }
    setWeakPinError(undefined)
    setChosenPinEntered(true)
  }, [chosenPin])

  useEffect(() => {
    setConfirmedPinEntered(confirmedPin.length === 6)
  }, [confirmedPin])

  const onEnterChosenPin = (pinValue: string): void => {
    if (chosenPinEntered) {
      return
    }

    setChosenPin(pinValue)
  }

  const onEnterConfirmedPin = (pinValue: string): void => {
    if (confirmedPinEntered) {
      return
    }
    setConfirmedPin(pinValue)
  }

  const resetPin = useCallback(() => {
    setChosenPin('')
    setConfirmedPin('')
    setWeakPinError(undefined)
  }, [])

  return {
    onEnterChosenPin,
    onEnterConfirmedPin,
    chosenPinEntered,
    chosenPin,
    confirmedPin,
    validPin,
    weakPinError,
    resetPin
  }
}
