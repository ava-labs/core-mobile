import { Text, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { useSeedlessManageRecoveryMethodsContext } from 'features/accountSettings/context/SeedlessManageRecoveryMethodsProvider'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useRegisteredRecoveryMethods } from 'features/onboarding/hooks/useRegisteredRecoveryMethods'
import React, { useState, useEffect, useCallback } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import SeedlessService from 'seedless/services/SeedlessService'
import { MFA } from 'seedless/types'

const TITLE = 'Verify recovery method'

const SelectRecoveryMethodScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const [mfaMethods, setMfaMethods] = useState<MFA[]>([])
  const registeredRecoveryMethods = useRegisteredRecoveryMethods(mfaMethods)
  const { onVerifyFido } = useSeedlessManageRecoveryMethodsContext()
  useEffect(() => {
    const getMfaMethods = async (): Promise<void> => {
      const mfas = await SeedlessService.session.userMfa()
      setMfaMethods(mfas)
    }
    getMfaMethods()
  }, [])

  const handleSelectMfa = useCallback(
    async (recoveryMethod: RecoveryMethod): Promise<void> => {
      if (recoveryMethod.mfa?.type === 'totp') {
        navigate('./verifyTotpCode')
        return
      }

      if (recoveryMethod.mfa?.type === 'fido') {
        onVerifyFido()
      }
    },
    [navigate, onVerifyFido]
  )

  return (
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
