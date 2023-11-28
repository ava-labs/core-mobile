import React, { useContext } from 'react'
import { Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation, useRoute } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import PasskeyService from 'seedless/services/PasskeyService'
import SeedlessService from 'seedless/services/SeedlessService'
import { RecoveryMethodsContext } from 'navigation/onboarding/RecoveryMethodsStack'
import { Alert } from 'react-native'
import Logger from 'utils/Logger'
import { Card } from '../components/Card'

type SelectRecoveryMethodsScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.SelectRecoveryMethods
>

export const SelectRecoveryMethods = (): JSX.Element => {
  const { navigate } =
    useNavigation<SelectRecoveryMethodsScreenProps['navigation']>()
  const { mfaId, oidcToken } = useContext(RecoveryMethodsContext)
  const {
    theme: { colors }
  } = useTheme()
  const {
    params: { mfaMethods }
  } = useRoute<SelectRecoveryMethodsScreenProps['route']>()

  const handleTotp = async (): Promise<void> => {
    navigate(AppNavigation.RecoveryMethods.VerifyCode)
  }

  const handleFido = async (): Promise<void> => {
    try {
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
      Logger.error('passkey authentication failed', e)
      Alert.alert('Passkey authentication error')
    }
  }

  return (
    <View sx={{ marginHorizontal: 16, flex: 1 }}>
      <Text variant="heading3">Verify Recovery Methods</Text>
      <Text variant="body1" sx={{ color: '$neutral50', marginVertical: 8 }}>
        Verify your recovery method(s) to continue.
      </Text>
      {mfaMethods.map((mfa, i) => {
        if (mfa.type === 'totp') {
          return (
            <Card
              onPress={handleTotp}
              icon={<Icons.Communication.IconKey color={colors.$neutral50} />}
              title="Authenticator"
              body="Use your authenticator app as your recovery method."
              showCaret
              key={i}
            />
          )
        } else if (mfa.type === 'fido' && PasskeyService.isSupported) {
          return (
            <Card
              onPress={handleFido}
              icon={<Icons.Communication.IconKey color={colors.$neutral50} />}
              title={mfa.name}
              body="Use your Passkey(or YubiKey) as your recovery method."
              showCaret
              key={i}
            />
          )
        }

        return null
      })}
    </View>
  )
}
