import { Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import React, { useContext } from 'react'
import SeedlessService from 'seedless/services/SeedlessService'
import PasskeyService from 'services/passkey/PasskeyService'
import { RecoveryMethodsContext } from 'navigation/onboarding/RecoveryMethodsStack'
import { Alert } from 'react-native'
import Logger from 'utils/Logger'
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
  const { mfaId, oidcToken } = useContext(RecoveryMethodsContext)

  const goToAuthenticatorSetup = (): void => {
    navigate(AppNavigation.RecoveryMethods.AuthenticatorSetup)
  }

  const handlePasskey = async (): Promise<void> => {
    try {
      await SeedlessService.registerFido('Passkey', false)

      await SeedlessService.approveFido(oidcToken, mfaId, false)

      navigate(AppNavigation.Root.Onboard, {
        screen: AppNavigation.Onboard.Welcome,
        params: {
          screen: AppNavigation.Onboard.AnalyticsConsent,
          params: {
            nextScreen: AppNavigation.Onboard.CreatePin
          }
        }
      })
    } catch (e) {
      Logger.error('passkey registration failed', e)
      Alert.alert('Passkey registration error')
    }
  }

  const handleYubikey = async (): Promise<void> => {
    try {
      await SeedlessService.registerFido('Yubikey', true)

      await SeedlessService.approveFido(oidcToken, mfaId, true)

      navigate(AppNavigation.Root.Onboard, {
        screen: AppNavigation.Onboard.Welcome,
        params: {
          screen: AppNavigation.Onboard.AnalyticsConsent,
          params: {
            nextScreen: AppNavigation.Onboard.CreatePin
          }
        }
      })
    } catch (e) {
      Logger.error('yubikey registration failed', e)
      Alert.alert('Yubikey registration error')
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
          onPress={handlePasskey}
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
          onPress={handleYubikey}
          icon={<Icons.Device.IconUSB color={colors.$neutral50} />}
          title="YubiKey"
          body="Add a YubiKey as a recovery method."
          showCaret
        />
      )}
    </View>
  )
}
