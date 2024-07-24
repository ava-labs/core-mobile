import { Button, Text, View } from '@avalabs/k2-mobile'
import React from 'react'
import { copyToClipboard } from 'utils/DeviceTools'
import ContentCopy from '../assets/ContentCopy.svg'
import QrCodeScanner from '../assets/QrCodeScanner.svg'
import { Card } from './Card'
import { SnackBarMessage } from './SnackBarMessage'

export const AuthenticatorSetup = ({
  totpKey,
  onLearnMore,
  onScanQrCode,
  onVerifyCode
}: {
  totpKey: string
  onLearnMore: () => void
  onScanQrCode: () => void
  onVerifyCode: () => void
}): JSX.Element => {
  const copyCode = (): void => {
    copyToClipboard(totpKey, <SnackBarMessage message="Key Copied" />)
  }

  return (
    <View
      sx={{ marginHorizontal: 16, flex: 1, justifyContent: 'space-between' }}>
      <View sx={{ flex: 1 }}>
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
              onPress={onLearnMore}>
              Learn more.
            </Text>
          </Text>
        </View>
        <Card
          onPress={copyCode}
          icon={<ContentCopy />}
          title="Copy Code"
          body={totpKey}
          bodyVariant="buttonLarge"
        />
        <Card
          onPress={onScanQrCode}
          icon={<QrCodeScanner />}
          title="Scan QR Code"
          body="View QR code to scan with your authenticator app."
        />
      </View>
      <Button
        type="primary"
        size="xlarge"
        style={{ marginVertical: 16 }}
        onPress={onVerifyCode}>
        Next
      </Button>
    </View>
  )
}
