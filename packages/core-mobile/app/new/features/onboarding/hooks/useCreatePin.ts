import { useCallback, useEffect, useState } from 'react'

export type UseCreatePinProps = {
  onEnterChosenPin: (pinKey: string) => void
  onEnterConfirmedPin: (pinKey: string) => void
  resetPin: () => void
  chosenPinEntered: boolean
  chosenPin: string
  confirmedPin: string
  validPin: string | undefined
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
    setChosenPinEntered(chosenPin.length === 6)
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
  }, [])

  return {
    onEnterChosenPin,
    onEnterConfirmedPin,
    chosenPinEntered,
    chosenPin,
    confirmedPin,
    validPin,
    resetPin
  }
}
