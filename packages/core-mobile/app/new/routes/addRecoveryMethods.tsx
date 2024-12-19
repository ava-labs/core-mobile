import React, { useState } from 'react'
import { View, Text, Button } from '@avalabs/k2-alpine'
import { useLocalSearchParams, useRouter } from 'expo-router'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  RecoveryMethods,
  useAvailableRecoveryMethods
} from 'new/hooks/useAvailableRecoveryMethods'
import { useSignupContext } from 'new/contexts/SignupProvider'
import { RecoveryMethodList } from '../components/RecoveryMethodList'

const AddRecoveryMethods = (): JSX.Element => {
  const { navigate } = useRouter()
  const { oidcAuth, handleAccountVerified } = useSignupContext()
  const { allowsUserToAddLater } = useLocalSearchParams<{
    allowsUserToAddLater: string
  }>()
  const availableRecoveryMethods = useAvailableRecoveryMethods()

  const [selectedMethod, setSelectedMethod] = useState(
    availableRecoveryMethods.length > 0
      ? availableRecoveryMethods[0]?.type
      : undefined
  )

  const handleOnPress = (): void => {
    if (selectedMethod === RecoveryMethods.Passkey) {
      // navigate({
      //   pathname: './fidoNameInput',
      //   params: {
      //     title: 'How would you like to name your passkey?',
      //     description: 'Add a Passkey name, so it’s easier to find later',
      //     textInputPlaceholder: 'Passkey name',
      //     fidoType: FidoType.PASS_KEY
      //   }
      // })
      return
    }
    if (selectedMethod === RecoveryMethods.Yubikey) {
      // navigate({
      //   pathname: './fidoNameInput',
      //   params: {
      //     title: 'How would you like to name your YubiKey?',
      //     description: 'Add a YubiKey name, so it’s easier to find later',
      //     textInputPlaceholder: 'YubiKey name',
      //     fidoType: FidoType.YUBI_KEY
      //   }
      // })
      return
    }
    if (selectedMethod === RecoveryMethods.Authenticator) {
      navigate('./authenticatorSetup')
      AnalyticsService.capture('SeedlessAddMfa', { type: 'Authenticator' })
    }
  }

  return (
    <BlurredBarsContentLayout>
      <View
        sx={{
          flex: 1,
          paddingTop: 25,
          paddingHorizontal: 16,
          justifyContent: 'space-between'
        }}>
        <View>
          <Text variant="heading2" sx={{ marginBottom: 8 }}>
            Add a recovery method
          </Text>
          <Text variant="body1" sx={{ marginBottom: 40 }}>
            Add recovery methods to securely restore access in case you lose
            your credentials.
          </Text>
          <RecoveryMethodList
            selectedMethod={selectedMethod}
            data={availableRecoveryMethods}
            onPress={setSelectedMethod}
          />
        </View>
        <View sx={{ gap: 16, marginBottom: 36 }}>
          <Button
            type="primary"
            size="large"
            onPress={handleOnPress}
            disabled={availableRecoveryMethods.length === 0}>
            Next
          </Button>
          {oidcAuth === undefined &&
            allowsUserToAddLater?.toLowerCase() === 'true' && (
              <Button
                type="tertiary"
                size="large"
                onPress={handleAccountVerified}>
                Skip
              </Button>
            )}
        </View>
      </View>
    </BlurredBarsContentLayout>
  )
}

export default AddRecoveryMethods
