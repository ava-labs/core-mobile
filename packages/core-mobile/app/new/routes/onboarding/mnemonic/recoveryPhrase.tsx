import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { InteractionManager } from 'react-native'
import WalletSDK from 'utils/WalletSDK'
import { RecoveryPhrase as Component } from 'features/onboarding/components/RecoveryPhrase'
import { isLimitedMode } from 'utils/limitedMode'

export default function RecoveryPhrase(): JSX.Element {
  const { navigate } = useRouter()
  const [localMnemonic, setLocalMnemonic] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  function handleNext(): void {
    navigate({
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

  // Step 1 of 6 in the limited-mode mnemonic create flow.
  const wizardStep = isLimitedMode
    ? { currentStep: 1, totalSteps: 6 }
    : undefined

  return (
    <Component
      onNext={handleNext}
      mnemonic={localMnemonic}
      isLoading={isLoading}
      wizardStep={wizardStep}
    />
  )
}
