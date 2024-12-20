import { useCallback, useEffect, useState } from 'react'

export type UseCreatePinProps = {
  title: string
  onEnterChosenPin: (pinKey: string) => void
  onEnterConfirmedPin: (pinKey: string) => void
  chosenPinEntered: boolean
  chosenPin: string
  confirmedPin: string
  validPin: string | undefined
}

export function useCreatePin({
  isResettingPin = false,
  onError
}: {
  isResettingPin?: boolean
  onError: () => Promise<void>
}): UseCreatePinProps {
  const [title, setTitle] = useState('Create Pin')
  const [chosenPin, setChosenPin] = useState('')
  const [confirmedPin, setConfirmedPin] = useState('')
  const [chosenPinEntered, setChosenPinEntered] = useState(false)
  const [confirmedPinEntered, setConfirmedPinEntered] = useState(false)
  const [validPin, setValidPin] = useState<string | undefined>(undefined)

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

  const onEnterChosenPin = (pinValue: string): void => {
    if (chosenPin.length === 6) {
      return
    }
    setChosenPin(pinValue)
    if (pinValue.length === 6) {
      //   setTimeout(() => {
      setChosenPinEntered(true)
      //   }, 300)
    }
  }

  const onEnterConfirmedPin = (pinValue: string): void => {
    if (confirmedPin.length === 6) {
      return
    }
    setConfirmedPin(pinValue)
    if (pinValue.length === 6) {
      setConfirmedPinEntered(true)
    }
  }

  return {
    title,
    onEnterChosenPin,
    onEnterConfirmedPin,
    chosenPinEntered,
    chosenPin,
    confirmedPin,
    validPin
  }
}
