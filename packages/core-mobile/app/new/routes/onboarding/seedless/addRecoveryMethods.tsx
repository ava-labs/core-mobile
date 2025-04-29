import React from 'react'
import { useRouter } from 'expo-router'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  RecoveryMethods,
  useAvailableRecoveryMethods
} from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { AddRecoveryMethods as Component } from 'features/onboarding/components/AddRecoveryMethods'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { FidoType } from 'services/passkey/types'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'

const AddRecoveryMethods = (): JSX.Element => {
  const { navigate } = useRouter()
  const { oidcAuth } = useRecoveryMethodContext()
  const availableRecoveryMethods = useAvailableRecoveryMethods()

  const handleOnNext = (selectedMethod: RecoveryMethod): void => {
    if (selectedMethod?.type === RecoveryMethods.Passkey) {
      AnalyticsService.capture('SeedlessAddMfa', { type: FidoType.PASS_KEY })
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/onboarding/seedless/fidoNameInput',
        params: {
          title: 'How would you like to name your passkey?',
          description: 'Add a Passkey name, so it’s easier to find later',
          textInputPlaceholder: 'Passkey name',
          fidoType: FidoType.PASS_KEY
        }
      })
      return
    }
    if (selectedMethod?.type === RecoveryMethods.Yubikey) {
      AnalyticsService.capture('SeedlessAddMfa', { type: FidoType.YUBI_KEY })
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/onboarding/seedless/fidoNameInput',
        params: {
          title: 'How would you like to name your YubiKey?',
          description: 'Add a YubiKey name, so it’s easier to find later',
          textInputPlaceholder: 'YubiKey name',
          fidoType: FidoType.YUBI_KEY
        }
      })
      return
    }
    if (selectedMethod?.type === RecoveryMethods.Authenticator) {
      // @ts-ignore TODO: make routes typesafe
      navigate('/onboarding/seedless/authenticatorSetup')
      AnalyticsService.capture('SeedlessAddMfa', { type: 'Authenticator' })
    }
  }

  const handleOnSkip = (): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/onboarding/seedless/analyticsConsent')
  }

  return (
    <Component
      onNext={handleOnNext}
      onSkip={handleOnSkip}
      allowsUserToAddLater={true}
      oidcAuth={oidcAuth}
      availableRecoveryMethods={availableRecoveryMethods}
    />
  )
}

export default AddRecoveryMethods
