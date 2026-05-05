import React from 'react'
import { useRouter } from 'expo-router'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  RecoveryMethods,
  useAvailableRecoveryMethods
} from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { AddRecoveryMethods as Component } from 'features/onboarding/components/AddRecoveryMethods'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { FidoType } from 'services/passkey/types'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'
import { isLimitedMode } from 'utils/limitedMode'

const AddRecoveryMethods = (): JSX.Element => {
  const { navigate } = useRouter()
  const { oidcAuth } = useRecoveryMethodContext()
  const availableRecoveryMethods = useAvailableRecoveryMethods()
  const dispatch = useDispatch()

  const handleOnNext = (selectedMethod: RecoveryMethod): void => {
    if (selectedMethod?.type === RecoveryMethods.Passkey) {
      AnalyticsService.capture('SeedlessAddMfa', { type: FidoType.PASS_KEY })
      navigate({
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
      navigate('/onboarding/seedless/authenticatorSetup')
      AnalyticsService.capture('SeedlessAddMfa', { type: 'Authenticator' })
    }
  }

  const handleOnSkip = (): void => {
    if (isLimitedMode) {
      dispatch(setCoreAnalytics(false))
      navigate('/onboarding/seedless/createPin')
      return
    }
    navigate('/onboarding/seedless/analyticsConsent')
  }

  // Limited mode wizard: addRecoveryMethods is step 1/5 in the seedless
  // create flow.
  const wizardStep = isLimitedMode
    ? { currentStep: 1, totalSteps: 5 }
    : undefined

  return (
    <Component
      onNext={handleOnNext}
      onSkip={handleOnSkip}
      allowsUserToAddLater={true}
      oidcAuth={oidcAuth}
      availableRecoveryMethods={availableRecoveryMethods}
      wizardStep={wizardStep}
    />
  )
}

export default AddRecoveryMethods
