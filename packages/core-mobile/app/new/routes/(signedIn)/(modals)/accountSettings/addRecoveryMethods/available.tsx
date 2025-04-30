import { View } from '@avalabs/k2-alpine'
import { Loader } from 'common/components/Loader'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useUserMfa } from 'common/hooks/useUserMfa'
import { useRouter } from 'expo-router'
import { useRecoveryMethodsContext } from 'features/accountSettings/context/RecoverMethodsProvider'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import {
  RecoveryMethod,
  RecoveryMethods,
  useAvailableRecoveryMethods
} from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import React, { useCallback } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { FidoType } from 'services/passkey/types'

const AvailableRecoveryMethodScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
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
          // @ts-ignore TODO: make routes typesafe
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
          // @ts-ignore TODO: make routes typesafe
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

  return (
    <ScrollScreen
      isModal
      title="Add a recovery method"
      subtitle="Add recovery methods to securely restore access in case you lose your credentials."
      contentContainerStyle={{ flex: 1, padding: 16 }}>
      {isLoading ? (
        <Loader />
      ) : (
        <View
          style={{
            marginTop: 24
          }}>
          <RecoveryMethodList
            data={available}
            onPress={handleAddRecoveryMethod}
          />
        </View>
      )}
    </ScrollScreen>
  )
}

export default AvailableRecoveryMethodScreen
