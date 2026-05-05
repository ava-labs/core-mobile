import { ScrollScreen } from 'common/components/ScrollScreen'
import { View } from '@avalabs/k2-alpine'
import { OnboardingWizardFooter } from 'common/components/OnboardingWizardFooter'
import { useRouter } from 'expo-router'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useRegisteredRecoveryMethods } from 'features/onboarding/hooks/useRegisteredRecoveryMethods'
import { useSeedlessRegister } from 'features/onboarding/hooks/useSeedlessRegister'
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'
import { isLimitedMode } from 'utils/limitedMode'

const SelectMfaMethodScreen = (): JSX.Element => {
  const { mfaMethods, oidcAuth } = useRecoveryMethodContext()
  const { verify } = useSeedlessRegister()
  const { navigate } = useRouter()
  const dispatch = useDispatch()
  const registeredRecoveryMethods = useRegisteredRecoveryMethods(mfaMethods)

  const handleSelectMFA = useCallback(
    (recoveryMethod: RecoveryMethod): void => {
      if (!recoveryMethod.mfa || !oidcAuth) return

      verify({
        mfa: recoveryMethod.mfa,
        oidcAuth,
        onAccountVerified: mfaType => {
          if (mfaType === 'totp') {
            navigate('/onboarding/seedless/verifyCode')
            return
          }
          if (mfaType === 'fido') {
            if (isLimitedMode) {
              dispatch(setCoreAnalytics(false))
              navigate('/onboarding/seedless/createPin')
            } else {
              navigate('/onboarding/seedless/analyticsConsent')
            }
          }
        }
      })
    },
    [navigate, oidcAuth, verify, dispatch]
  )

  // Decorative wizard footer — user advances by tapping a method tile,
  // FAB stays disabled.
  const renderFooter = useCallback((): JSX.Element | null => {
    if (!isLimitedMode) return null
    return (
      <OnboardingWizardFooter
        currentStep={1}
        totalSteps={5}
        onNext={() => undefined}
        disabled
      />
    )
  }, [])

  return (
    <ScrollScreen
      showNavigationHeaderTitle={false}
      title={`Verify recovery\nmethods`}
      subtitle="Verify your recovery method(s) to continue."
      contentContainerStyle={{ padding: 16, flex: 1 }}
      renderFooter={isLimitedMode ? renderFooter : undefined}>
      <View
        style={{
          marginTop: 24
        }}>
        <RecoveryMethodList
          data={registeredRecoveryMethods}
          onPress={handleSelectMFA}
        />
      </View>
    </ScrollScreen>
  )
}

export default SelectMfaMethodScreen
