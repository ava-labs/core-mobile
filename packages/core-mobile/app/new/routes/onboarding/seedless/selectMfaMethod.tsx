import { ScrollScreen } from 'common/components/ScrollScreen'
import { View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useRegisteredRecoveryMethods } from 'features/onboarding/hooks/useRegisteredRecoveryMethods'
import { useSeedlessRegister } from 'features/onboarding/hooks/useSeedlessRegister'
import React, { useCallback } from 'react'

const SelectMfaMethodScreen = (): JSX.Element => {
  const { mfaMethods, oidcAuth } = useRecoveryMethodContext()
  const { verify } = useSeedlessRegister()
  const { navigate } = useRouter()
  const registeredRecoveryMethods = useRegisteredRecoveryMethods(mfaMethods)

  const handleSelectMFA = useCallback(
    (recoveryMethod: RecoveryMethod): void => {
      if (!recoveryMethod.mfa || !oidcAuth) return

      verify({
        mfa: recoveryMethod.mfa,
        oidcAuth,
        onAccountVerified: mfaType => {
          if (mfaType === 'totp') {
            // @ts-ignore TODO: make routes typesafe
            navigate('/onboarding/seedless/verifyCode')
            return
          }
          if (mfaType === 'fido') {
            // @ts-ignore TODO: make routes typesafe
            navigate('/onboarding/seedless/analyticsConsent')
          }
        }
      })
    },
    [navigate, oidcAuth, verify]
  )

  return (
    <ScrollScreen
      title={`Verify recovery\nmethods`}
      navigationTitle="Verify recovery methods"
      subtitle="Verify your recovery method(s) to continue."
      contentContainerStyle={{ padding: 16, flex: 1 }}>
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
