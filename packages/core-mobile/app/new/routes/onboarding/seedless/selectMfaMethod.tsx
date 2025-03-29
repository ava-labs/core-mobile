import React, { useCallback } from 'react'
import { SafeAreaView, Text, View } from '@avalabs/k2-alpine'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { useRouter } from 'expo-router'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import { useRegisteredRecoveryMethods } from 'features/onboarding/hooks/useRegisteredRecoveryMethods'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useSeedlessRegister } from 'seedless/hooks/useSeedlessRegister'

const SelectMfaMethodScreen = (): JSX.Element => {
  const { mfaMethods, oidcAuth } = useRecoveryMethodContext()
  const { verify } = useSeedlessRegister()
  const { navigate } = useRouter()
  const registeredRecoveryMethods = useRegisteredRecoveryMethods(mfaMethods)

  const handleSelectMFA = useCallback(
    (recoveryMethod: RecoveryMethod): void => {
      if (!recoveryMethod.mfa || !oidcAuth) return

      verify(recoveryMethod.mfa, oidcAuth, mfaType => {
        if (mfaType === 'totp') {
          navigate('./verifyCodeModal')
          return
        }
        if (mfaType === 'fido') {
          navigate('./analyticsConsent')
        }
      })
    },
    [navigate, oidcAuth, verify]
  )

  return (
    <BlurredBarsContentLayout>
      <SafeAreaView sx={{ margin: 16 }}>
        <View sx={{ marginBottom: 24 }}>
          <Text variant="heading3">Verify recovery methods</Text>
          <Text
            variant="body1"
            sx={{ color: '$textPrimary', marginVertical: 8 }}>
            Verify your recovery method(s) to continue.
          </Text>
        </View>
        <RecoveryMethodList
          data={registeredRecoveryMethods}
          onPress={handleSelectMFA}
        />
      </SafeAreaView>
    </BlurredBarsContentLayout>
  )
}

export default SelectMfaMethodScreen
