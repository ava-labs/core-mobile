import React, { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { SetWalletName as Component } from 'features/onboarding/components/SetWalletName'
import { usePendingSeedlessWalletName } from 'features/onboarding/store'
import { isLimitedMode } from 'utils/limitedMode'

export default function SetWalletName(): JSX.Element {
  const [name, setName] = useState<string>('Wallet 1')
  const { navigate } = useRouter()
  const { setPendingSeedlessWalletName } = usePendingSeedlessWalletName()

  const handleNext = useCallback((): void => {
    // the wallet is not created at this point, so we need to store the name temporarily
    // later, when the wallet is created, we will set the name in the listener
    setPendingSeedlessWalletName(name)

    navigate(
      isLimitedMode
        ? '/onboarding/seedless/confirmation'
        : '/onboarding/seedless/selectAvatar'
    )
  }, [name, setPendingSeedlessWalletName, navigate])

  // Limited mode wizard: setWalletName is step 3/5 in the seedless flow.
  const wizardStep = isLimitedMode
    ? { currentStep: 3, totalSteps: 5 }
    : undefined

  return (
    <Component
      name={name}
      setName={setName}
      onNext={handleNext}
      wizardStep={wizardStep}
    />
  )
}
