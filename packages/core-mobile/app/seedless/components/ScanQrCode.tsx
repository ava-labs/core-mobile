import { Button, Text, View } from '@avalabs/k2-mobile'
import React from 'react'
import { Dimensions } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

const { width: screenWidth } = Dimensions.get('window')

const qrCodeContainerSize = screenWidth - 96
const qrCodeSize = qrCodeContainerSize - 40

export const ScanQrCode = ({
  totpUrl,
  onPressEnterManually,
  onVeryfiCode
}: {
  totpUrl: string | undefined
  onPressEnterManually: () => void
  onVeryfiCode: () => void
}): JSX.Element => {
  const renderQRCode = (): JSX.Element => {
    const borderColor = '$white'
    return (
      <View
        sx={{
          marginVertical: 24,
          borderWidth: 32,
          height: qrCodeContainerSize,
          width: qrCodeContainerSize,
          borderColor,
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center'
        }}>
        <QRCode ecl={'H'} size={qrCodeSize} value={totpUrl} />
      </View>
    )
  }

  return (
    <View
      sx={{ marginHorizontal: 16, flex: 1, justifyContent: 'space-between' }}>
      <View>
        <Text variant="heading3">Scan QR Code</Text>
        <View sx={{ marginVertical: 8 }}>
          <Text variant="body1" sx={{ color: '$neutral50' }}>
            Open any <Text variant="heading6">authenticator app</Text> and scan
            the QR code found below.
          </Text>
          <Text variant="body1" sx={{ color: '$neutral50', marginTop: 32 }}>
            Or enter code manually.
          </Text>
        </View>
        {renderQRCode()}
        <Button type="tertiary" size="xlarge" onPress={onPressEnterManually}>
          Enter Code Manually
        </Button>
      </View>

      <Button
        type="primary"
        size="xlarge"
        style={{ marginVertical: 16 }}
        onPress={onVeryfiCode}>
        Next
      </Button>
    </View>
  )
}
