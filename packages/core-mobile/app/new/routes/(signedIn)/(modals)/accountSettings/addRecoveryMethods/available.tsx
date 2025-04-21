import { Text, View } from '@avalabs/k2-alpine'
import { Loader } from 'common/components/Loader'
import { useUserMfa } from 'common/hooks/useUserMfa'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'
import { Space } from 'components/Space'
import { useRecoveryMethodsContext } from 'features/accountSettings/context/RecoverMethodsProvider'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import {
  RecoveryMethod,
  RecoveryMethods,
  useAvailableRecoveryMethods
} from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import React, { useCallback } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { FidoType } from 'services/passkey/types'

const AvailableRecoveryMethodScreen = (): React.JSX.Element => {
  const { navigate } = useDebouncedRouter()
  const { data: mfaMethods, isLoading } = useUserMfa()
  const available = useAvailableRecoveryMethods(mfaMethods)
  const { totpResetInit } = useRecoveryMethodsContext()

  const handleAddRecoveryMethod = useCallback(
    async (recoveryMethod: RecoveryMethod): Promise<void> => {
      if (recoveryMethod.type === RecoveryMethods.Authenticator) {
        AnalyticsService.capture('SeedlessAddMfa', { type: 'Authenticator' })
        await totpResetInit()
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
    [navigate, totpResetInit]
  )

  return isLoading ? (
    <Loader />
  ) : (
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
