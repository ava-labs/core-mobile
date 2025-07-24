import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { SetWalletName as Component } from 'features/onboarding/components/SetWalletName'
import { usePendingSeedlessWalletName } from 'features/onboarding/store'
import { useDebouncedCallback } from 'use-debounce'

export default function SetWalletName(): JSX.Element {
  const [name, setName] = useState<string>('Wallet 1')
  const { navigate } = useRouter()
  const { setPendingSeedlessWalletName } = usePendingSeedlessWalletName()

  const handleNext = (): void => {
    // the wallet is not created at this point, so we need to store the name temporarily
    // later, when the wallet is created, we will set the name in the listener
    setPendingSeedlessWalletName(name)

    // @ts-ignore TODO: make routes typesafe
    navigate('/onboarding/seedless/selectAvatar')
  }

  const debouncedHandleNext = useDebouncedCallback(handleNext, 1000)

  return (
    <Component name={name} setName={setName} onNext={debouncedHandleNext} />
  )
}
