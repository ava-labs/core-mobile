import React, { useState } from 'react'
import { View, Text, Button } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'
import {
  selectIsSeedlessMfaAuthenticatorBlocked,
  selectIsSeedlessMfaPasskeyBlocked,
  selectIsSeedlessMfaYubikeyBlocked
} from 'store/posthog'
import { FidoType } from 'services/passkey/types'
import { useSelector } from 'react-redux'
import { RecoveryMethodList } from './conponents/RecoveryMethodList'
import { RECOVERY_METHODS } from './consts'
import { RecoveryMethod } from './types'

const AddRecoveryMethods = (): JSX.Element => {
  const { navigate } = useRouter()

  const isSeedlessMfaPasskeyBlocked = useSelector(
    selectIsSeedlessMfaPasskeyBlocked
  )
  const isSeedlessMfaAuthenticatorBlocked = useSelector(
    selectIsSeedlessMfaAuthenticatorBlocked
  )
  const isSeedlessMfaYubikeyBlocked = useSelector(
    selectIsSeedlessMfaYubikeyBlocked
  )

  // const defaultRecoveryMethod = !isSeedlessMfaPasskeyBlocked ? RecoveryMethod.Passkey : !isSeedlessMfaAuthenticatorBlocked ? RecoveryMethod.Authenticator : !isSeedlessMfaYubikeyBlocked ? RecoveryMethod.Yubikey : undefined

  const [selectedMethod, setSelectedMethod] = useState(RecoveryMethod.Passkey)

  const handleOnPress = (): void => {
    if (selectedMethod === RecoveryMethod.Passkey) {
      navigate({
        pathname: '/signup/onboarding/addRecoveryMethods/fidoNameInput',
        params: {
          title: 'How would you like to name your passkey?',
          description: 'Add a Passkey name, so it’s easier to find later',
          textInputPlaceholder: 'Passkey name',
          fidoType: FidoType.PASS_KEY
        }
      })
      return
    }
    if (selectedMethod === RecoveryMethod.Yubikey) {
      navigate({
        pathname: '/signup/onboarding/addRecoveryMethods/fidoNameInput',
        params: {
          title: 'How would you like to name your YubiKey?',
          description: 'Add a YubiKey name, so it’s easier to find later',
          textInputPlaceholder: 'YubiKey name',
          fidoType: FidoType.YUBI_KEY
        }
      })
      return
    }
    if (selectedMethod === RecoveryMethod.Authenticator) {
      navigate('/signup/onboarding/addRecoveryMethods/totp')
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
            data={RECOVERY_METHODS}
            onPress={setSelectedMethod}
          />
        </View>
        <View sx={{ gap: 16, marginBottom: 36 }}>
          <Button type="primary" size="large" onPress={handleOnPress}>
            Next
          </Button>
          <Button
            type="tertiary"
            size="large"
            onPress={() => navigate('/signup/onboarding/unlockAirdrops')}>
            Skip
          </Button>
        </View>
      </View>
    </BlurredBarsContentLayout>
  )
}

export default AddRecoveryMethods
