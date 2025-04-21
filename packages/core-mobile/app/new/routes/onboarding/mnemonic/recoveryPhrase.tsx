import React, { useEffect, useState } from 'react'
import { InteractionManager } from 'react-native'
import WalletSDK from 'utils/WalletSDK'
import { RecoveryPhrase as Component } from 'features/onboarding/components/RecoveryPhrase'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export default function RecoveryPhrase(): JSX.Element {
  const { navigate } = useDebouncedRouter()
  const [localMnemonic, setLocalMnemonic] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  function handleNext(): void {
    navigate({
      pathname: './verifyRecoveryPhrase',
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
