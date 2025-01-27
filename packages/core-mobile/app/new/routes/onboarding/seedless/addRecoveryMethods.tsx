import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  RecoveryMethods,
  useAvailableRecoveryMethods
} from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { AddRecoveryMethods as Component } from 'features/onboarding/components/AddRecoveryMethods'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { FidoType } from 'services/passkey/types'

const AddRecoveryMethods = (): JSX.Element => {
  const { navigate } = useRouter()
  const { oidcAuth } = useRecoveryMethodContext()
  const availableRecoveryMethods = useAvailableRecoveryMethods()

  const [selectedMethod, setSelectedMethod] = useState(
    availableRecoveryMethods.length > 0
      ? availableRecoveryMethods[0]?.type
      : undefined
  )

  const handleOnNext = (): void => {
    if (selectedMethod === RecoveryMethods.Passkey) {
      navigate({
        pathname: './fidoNameInput',
        params: {
          title: 'How would you like to name your passkey?',
          description: 'Add a Passkey name, so it’s easier to find later',
          textInputPlaceholder: 'Passkey name',
          fidoType: FidoType.PASS_KEY
        }
      })
      return
    }
    if (selectedMethod === RecoveryMethods.Yubikey) {
      navigate({
        pathname: './fidoNameInput',
        params: {
          title: 'How would you like to name your YubiKey?',
          description: 'Add a YubiKey name, so it’s easier to find later',
          textInputPlaceholder: 'YubiKey name',
          fidoType: FidoType.YUBI_KEY
        }
      })
      return
    }
    if (selectedMethod === RecoveryMethods.Authenticator) {
      navigate('./authenticatorSetup')
      AnalyticsService.capture('SeedlessAddMfa', { type: 'Authenticator' })
    }
  }

  const handleOnSkip = (): void => {
    navigate('./analyticsConsent')
  }

  return (
    <Component
      onNext={handleOnNext}
      onSkip={handleOnSkip}
      allowsUserToAddLater={true}
      oidcAuth={oidcAuth}
      availableRecoveryMethods={availableRecoveryMethods}
      selectedMethod={selectedMethod}
      setSelectedMethod={setSelectedMethod}
    />
  )
}

export default AddRecoveryMethods
