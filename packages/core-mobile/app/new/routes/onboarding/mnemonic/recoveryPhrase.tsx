import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { InteractionManager } from 'react-native'
import WalletSDK from 'utils/WalletSDK'
import { RecoveryPhrase as Component } from 'features/onboarding/components/RecoveryPhrase'

export default function RecoveryPhrase(): JSX.Element {
  const { navigate } = useRouter()
  const [localMnemonic, setLocalMnemonic] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  function handleNext(): void {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/mnemonic/verifyRecoveryPhrase',
      params: { mnemonic: localMnemonic }
    })
  }

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      ;(async () => {
        const newPhrase = await WalletSDK.generateMnemonic()
        setLocalMnemonic(newPhrase)
        setIsLoading(false)
      })()
    })
  }, [])

  return (
    <Component
      onNext={handleNext}
      mnemonic={localMnemonic}
      isLoading={isLoading}
    />
  )
}
