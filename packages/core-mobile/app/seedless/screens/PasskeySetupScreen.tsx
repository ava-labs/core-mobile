import { Button, Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import React, { useContext } from 'react'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { Space } from 'components/Space'
import { RecoveryMethodsContext } from 'navigation/onboarding/RecoveryMethodsStack'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'
import { showSimpleToast } from 'components/Snackbar'

type PasskeySetupScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.PasskeySetup
>

export const PasskeySetupScreen = (): JSX.Element => {
  const { canGoBack, goBack, navigate } =
    useNavigation<PasskeySetupScreenProps['navigation']>()
  const { oidcToken, mfaId } = useContext(RecoveryMethodsContext)
  const {
    theme: { colors }
  } = useTheme()

  const handleGoBack = (): void => {
    if (canGoBack()) {
      goBack()
    }
  }

  const handleNext = async (): Promise<void> => {
    navigate(AppNavigation.RecoveryMethods.FIDONameInput, {
      title: 'Name Your Passkey',
      description: "Add a Passkey name, so it's easier to find later.",
      inputFieldLabel: 'Passkey Name',
      inputFieldPlaceholder: 'Enter Name',
      onClose: async (name?: string) => {
        const passkeyName = name && name.length > 0 ? name : 'Passkey'

        try {
          await SeedlessService.registerFido(passkeyName, false)

          await SeedlessService.approveFido(oidcToken, mfaId, false)

          goBack()

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
          showSimpleToast('Unable to register passkey')
        }
      }
    })
  }

  return (
    <View
      sx={{
        flex: 1,
        marginHorizontal: 16
      }}>
      <View sx={{ flexGrow: 1 }}>
        <Text variant="heading3">Passkey Setup</Text>
        <View sx={{ marginVertical: 16 }}>
          <Text variant="body1" sx={{ color: '$neutral50' }}>
            Securely recover your wallet using Touch ID, Face ID, screen lock,
            or hardware security key.
          </Text>
          <Space y={16} />
          <Text variant="body1" sx={{ color: '$neutral50' }}>
            You can create a passkey on this device or use another device.
          </Text>
        </View>
        <View
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1
          }}>
          <Icons.Communication.IconKey
            color={colors.$neutral50}
            width={80}
            height={80}
          />
        </View>
      </View>
      <View sx={{ marginTop: 130 }}>
        <Button type="primary" size="xlarge" onPress={handleNext}>
          Next
        </Button>
        <Button
          type="tertiary"
          size="xlarge"
          style={{ marginVertical: 16 }}
          onPress={handleGoBack}>
          Use Another Device
        </Button>
      </View>
    </View>
  )
}
