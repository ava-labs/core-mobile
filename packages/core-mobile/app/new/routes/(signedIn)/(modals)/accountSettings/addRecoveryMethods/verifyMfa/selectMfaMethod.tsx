import { Text, View } from '@avalabs/k2-alpine'
import { Loader } from 'common/components/Loader'
import { useUserMfa } from 'common/hooks/useUserMfa'
import { useRouter } from 'expo-router'
import { useRecoveryMethodsContext } from 'features/accountSettings/context/RecoverMethodsProvider'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useRegisteredRecoveryMethods } from 'features/onboarding/hooks/useRegisteredRecoveryMethods'
import React, { useCallback } from 'react'
import { ScrollView } from 'react-native-gesture-handler'

const TITLE = 'Verify recovery method'

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

  return isLoading ? (
    <Loader />
  ) : (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: 60,
        paddingHorizontal: 16,
        gap: 16
      }}>
      <View sx={{ gap: 8 }}>
        <Text variant="heading2">{TITLE}</Text>
        <Text variant="body1" sx={{ color: '$textPrimary', marginVertical: 8 }}>
          Verify your recovery method(s) to continue.
        </Text>
      </View>
      <RecoveryMethodList
        data={registeredRecoveryMethods}
        onPress={handleSelectMfa}
      />
    </ScrollView>
  )
}

export default SelectRecoveryMethodScreen
