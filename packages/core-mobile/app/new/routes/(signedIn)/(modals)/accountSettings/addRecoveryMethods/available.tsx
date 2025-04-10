import { Text, View } from '@avalabs/k2-alpine'
import { Space } from 'components/Space'
import { useRouter } from 'expo-router'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import {
  RecoveryMethod,
  RecoveryMethods,
  useAvailableRecoveryMethods
} from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import React, { useState, useEffect, useCallback } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import SeedlessService from 'seedless/services/SeedlessService'
import { MFA } from 'seedless/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { FidoType } from 'services/passkey/types'

const AvailableRecoveryMethodScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const [mfaMethods, setMfaMethods] = useState<MFA[]>([])
  const available = useAvailableRecoveryMethods(mfaMethods)

  useEffect(() => {
    const getMfaMethods = async (): Promise<void> => {
      const mfas = await SeedlessService.session.userMfa()
      setMfaMethods(mfas)
    }
    getMfaMethods()
  }, [])

  const handleAddRecoveryMethod = useCallback(
    (recoveryMethod: RecoveryMethod): void => {
      if (recoveryMethod.type === RecoveryMethods.Authenticator) {
        AnalyticsService.capture('SeedlessAddMfa', { type: 'Authenticator' })
        navigate('/accountSettings/addRecoveryMethods/authenticatorSetup')
      } else if (recoveryMethod.type === RecoveryMethods.Passkey) {
        AnalyticsService.capture('SeedlessAddMfa', { type: FidoType.PASS_KEY })
        navigate({
          pathname: '/accountSettings/addRecoveryMethods/fidoNameInput',
          params: {
            title: 'How would you like to name your passkey?',
            description: 'Add a Passkey name, so it’s easier to find later',
            textInputPlaceholder: 'Passkey name',
            fidoType: FidoType.PASS_KEY
          }
        })
      } else if (recoveryMethod.type === RecoveryMethods.Yubikey) {
        AnalyticsService.capture('SeedlessAddMfa', { type: FidoType.YUBI_KEY })
        navigate({
          pathname: '/accountSettings/addRecoveryMethods/fidoNameInput',
          params: {
            title: 'How would you like to name your YubiKey?',
            description: 'Add a YubiKey name, so it’s easier to find later',
            textInputPlaceholder: 'YubiKey name',
            fidoType: FidoType.YUBI_KEY
          }
        })
      }
    },
    [navigate]
  )

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 16 }}>
      <View sx={{ gap: 16 }}>
        <Text variant="heading2">{`Add a recovery\nmethod`}</Text>
        <Text variant="body1" sx={{ color: '$textPrimary', marginVertical: 8 }}>
          Add recovery methods to securely restore access in case you lose your
          credentials.
        </Text>
      </View>
      <Space y={16} />
      <RecoveryMethodList data={available} onPress={handleAddRecoveryMethod} />
    </ScrollView>
  )
}

export default AvailableRecoveryMethodScreen
