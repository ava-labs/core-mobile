import { View } from '@avalabs/k2-alpine'
import { Loader } from 'common/components/Loader'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useUserMfa } from 'common/hooks/useUserMfa'
import { useRouter } from 'expo-router'
import { useRecoveryMethodsContext } from 'features/accountSettings/context/RecoverMethodsProvider'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useRegisteredRecoveryMethods } from 'features/onboarding/hooks/useRegisteredRecoveryMethods'
import React, { useCallback } from 'react'

const SelectRecoveryMethodScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const { onVerifyFido } = useRecoveryMethodsContext()
  const { data: mfaMethods, isLoading } = useUserMfa()
  const registeredRecoveryMethods = useRegisteredRecoveryMethods(mfaMethods)

  const handleSelectMfa = useCallback(
    async (recoveryMethod: RecoveryMethod): Promise<void> => {
      if (recoveryMethod.mfa?.type === 'totp') {
        // @ts-ignore TODO: make routes typesafe
        navigate('/accountSettings/addRecoveryMethods/verifyMfa/verifyTotpCode')
        return
      }

      if (recoveryMethod.mfa?.type === 'fido') {
        onVerifyFido()
      }
    },
    [navigate, onVerifyFido]
  )

  return (
    <ScrollScreen
      title="Verify recovery method"
      subtitle="Verify your recovery method(s) to continue."
      contentContainerStyle={{
        flex: 1,
        padding: 16
      }}>
      {isLoading ? (
        <Loader />
      ) : (
        <View
          style={{
            marginTop: 24
          }}>
          <RecoveryMethodList
            data={registeredRecoveryMethods}
            onPress={handleSelectMfa}
          />
        </View>
      )}
    </ScrollScreen>
  )
}

export default SelectRecoveryMethodScreen
