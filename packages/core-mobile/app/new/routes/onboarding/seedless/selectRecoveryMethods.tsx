import React, { useCallback, useEffect } from 'react'
import { SafeAreaView, Text, View } from '@avalabs/k2-alpine'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { useNavigation, useRouter } from 'expo-router'
import BackBarButton from 'common/components/BackBarButton'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import { useRegisteredRecoveryMethods } from 'features/onboarding/hooks/useRegisteredRecoveryMethods'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useSeedlessRegister } from 'seedless/hooks/useSeedlessRegister'

const SelectRecoveryMethodsScreen = (): JSX.Element => {
  const { mfaMethods, oidcAuth } = useRecoveryMethodContext()
  const { verify } = useSeedlessRegister()
  const { setOptions } = useNavigation()
  const { canGoBack, back, navigate } = useRouter()
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

  const handlePressBack = useCallback((): void => {
    canGoBack() && back()
  }, [back, canGoBack])

  const renderCustomBackButton = useCallback(() => {
    return <BackBarButton onBack={handlePressBack} />
  }, [handlePressBack])

  useEffect(() => {
    setOptions({ headerLeft: renderCustomBackButton })
  }, [setOptions, handlePressBack, renderCustomBackButton])

  return (
    <BlurredBarsContentLayout>
      <SafeAreaView sx={{ margin: 16 }}>
        <View sx={{ marginBottom: 24 }}>
          <Text variant="heading3">Verify Recovery Methods</Text>
          <Text variant="body1" sx={{ color: '$neutral50', marginVertical: 8 }}>
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

export default SelectRecoveryMethodsScreen
