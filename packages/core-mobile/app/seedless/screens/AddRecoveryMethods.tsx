import { Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import React from 'react'
import SeedlessService from 'seedless/services/SeedlessService'
import PasskeyService from 'seedless/services/PasskeyService'
import { Card } from '../components/Card'

type AddRecoveryMethodsScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.AddRecoveryMethods
>

export const AddRecoveryMethods = (): JSX.Element => {
  const { navigate } =
    useNavigation<AddRecoveryMethodsScreenProps['navigation']>()
  const {
    theme: { colors }
  } = useTheme()

  const goToAuthenticatorSetup = (): void => {
    navigate(AppNavigation.RecoveryMethods.AuthenticatorSetup)
  }

  const goToFidoSetup = async (): Promise<void> => {
    const mfa = await SeedlessService.userMfa()
    if (mfa.length === 0) {
      const challenge = await SeedlessService.addFidoStart('Test')

      // console.log('challenge', challenge.options)

      try {
        const result = await PasskeyService.register(challenge.options)
        // eslint-disable-next-line no-console
        console.log(result)
      } catch (e) {
        // console.log(e)
      }

      // await challenge.answer()
    }
  }

  return (
    <View sx={{ marginHorizontal: 16, flex: 1 }}>
      <Text variant="heading3">Add Recovery Methods</Text>
      <Text variant="body1" sx={{ color: '$neutral50', marginVertical: 8 }}>
        Add <Text variant="heading6">one</Text> recovery method to continue.
      </Text>
      {PasskeyService.isSupported && (
        <Card
          onPress={goToFidoSetup}
          icon={<Icons.Communication.IconKey color={colors.$neutral50} />}
          title="Passkey"
          body="Add a passkey as a recovery method."
          showCaret
        />
      )}
      <Card
        onPress={goToAuthenticatorSetup}
        icon={<Icons.Communication.IconQRCode color={colors.$neutral50} />}
        title="Authenticator"
        body="Add an authenticator app as a recovery method."
        showCaret
      />
      {PasskeyService.isSupported && (
        <Card
          onPress={goToFidoSetup}
          icon={<Icons.Device.IconUSB color={colors.$neutral50} />}
          title="YubiKey"
          body="Add a YubiKey as a recovery method."
          showCaret
        />
      )}
    </View>
  )
}
