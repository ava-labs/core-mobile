import { Button, Text, View } from '@avalabs/k2-mobile'
import React, { useEffect, useState } from 'react'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { copyToClipboard } from 'utils/DeviceTools'
import AuthenticatorService from 'seedless/services/AuthenticatorService'
import Logger from 'utils/Logger'
import ContentCopy from '../assets/ContentCopy.svg'
import QrCodeScanner from '../assets/QrCodeScanner.svg'
import { Card } from '../components/Card'
import { SnackBarMessage } from '../components/SnackBarMessage'

type AuthenticatorSetupScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.AuthenticatorSetup
>

export const AuthenticatorSetup = (): JSX.Element => {
  const [code, setCode] = useState<string>()
  const { navigate } =
    useNavigation<AuthenticatorSetupScreenProps['navigation']>()

  const openLearnMore = (): void => {
    navigate(AppNavigation.RecoveryMethods.LearnMore, { totpCode: code })
  }

  const openScanQrCode = (): void => {
    navigate(AppNavigation.RecoveryMethods.ScanQrCode)
  }

  const copyCode = (): void => {
    copyToClipboard(code, <SnackBarMessage />)
  }

  const openVerifyCode = (): void => {
    navigate(AppNavigation.RecoveryMethods.VerifyCode)
  }

  useEffect(() => {
    const init = async (): Promise<void> => {
      const result = await AuthenticatorService.setTotp()
      if (result.success && result.value) {
        const totpCode = new URL(result.value).searchParams.get('secret')
        totpCode && setCode(totpCode)
      }
    }
    init().catch(reason => {
      Logger.error(
        'AuthenticatorSetup AuthenticatorService.setTotp error',
        reason
      )
    })
  }, [])

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

        {code && (
          <Card
            onPress={copyCode}
            icon={<ContentCopy />}
            title="Copy Code"
            body={code}
            bodyVariant="buttonLarge"
          />
        )}
        <Card
          onPress={openScanQrCode}
          icon={<QrCodeScanner />}
          title="Scan QR Code"
          body="View QR code to scan with your authenticator app."
        />
      </View>

      <Button
        type="primary"
        size="xlarge"
        style={{ marginVertical: 16 }}
        onPress={openVerifyCode}>
        Next
      </Button>
    </View>
  )
}
