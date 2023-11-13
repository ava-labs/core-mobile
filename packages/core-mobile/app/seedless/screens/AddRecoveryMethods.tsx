import { Text, View } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import React from 'react'
import QrCode from 'assets/icons/QrCode.svg'
import { Card } from '../components'

type AddRecoveryMethodsScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.AddRecoveryMethods
>

export const AddRecoveryMethods = (): JSX.Element => {
  const { navigate } =
    useNavigation<AddRecoveryMethodsScreenProps['navigation']>()

  const goToAuthenticatorSetup = (): void => {
    navigate(AppNavigation.RecoveryMethods.AuthenticatorSetup)
  }

  return (
    <View sx={{ marginHorizontal: 16, flex: 1 }}>
      <Text variant="heading3">Add Recovery Methods</Text>
      <Text variant="body1" sx={{ color: '$neutral50', marginVertical: 8 }}>
        Add <Text variant="heading6">one</Text> recovery method to continue.
      </Text>
      <Card
        onPress={goToAuthenticatorSetup}
        icon={<QrCode />}
        title="Authenticator"
        body="Add an authenticator app as a recovery method."
        showCaret
      />
    </View>
  )
}
