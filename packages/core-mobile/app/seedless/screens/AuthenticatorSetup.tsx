import { Button, Text, View } from '@avalabs/k2-mobile'
import React from 'react'
import QrCodeScanner from 'assets/icons/QrCodeScanner.svg'
import ContentCopy from 'assets/icons/ContentCopy.svg'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { copyToClipboard } from 'utils/DeviceTools'
import { Card } from '../components'
import { SnackBarMessage } from '../components/SnackBarMessage'

type AuthenticatorSetupScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.AuthenticatorSetup
>

export const AuthenticatorSetup = (): JSX.Element => {
  const { navigate } =
    useNavigation<AuthenticatorSetupScreenProps['navigation']>()

  const openLearnMore = (): void => {
    navigate(AppNavigation.RecoveryMethods.LearnMore)
  }

  const openScanQrCode = (): void => {
    navigate(AppNavigation.RecoveryMethods.ScanQrCode)
  }

  const copyCode = (): void => {
    copyToClipboard('TO_BE_IMPLEMENTED', <SnackBarMessage />)
  }

  const openVerifyCode = (): void => {
    navigate(AppNavigation.RecoveryMethods.VerifyCode)
  }

  return (
    <View
      sx={{ marginHorizontal: 16, flex: 1, justifyContent: 'space-between' }}>
      <View>
        <Text variant="heading3">Authenticator Setup</Text>
        <View sx={{ marginVertical: 8 }}>
          <Text variant="body1" sx={{ color: '$neutral50' }}>
            Open any <Text variant="heading6">authenticator app</Text> and use
            it to enter the code found below.
          </Text>
          <Text variant="body1" sx={{ color: '$neutral50', marginTop: 32 }}>
            Or tap Scan QR Code.{' '}
            <Text
              variant="heading6"
              sx={{ color: '$blueMain' }}
              onPress={openLearnMore}>
              Learn more.
            </Text>
          </Text>
        </View>

        <Card
          onPress={copyCode}
          icon={<ContentCopy />}
          title="Copy Code"
          body="TO_BE_IMPLEMENTED"
          bodyVariant="buttonLarge"
        />
        <Card
          onPress={openScanQrCode}
          icon={<QrCodeScanner />}
          title="Scan QR Code"
          body="View QR code to scan with your authenticator app."
        />
      </View>

      <Button
        type="primary"
        size="large"
        style={{ marginVertical: 16 }}
        onPress={openVerifyCode}>
        Next
      </Button>
    </View>
  )
}
