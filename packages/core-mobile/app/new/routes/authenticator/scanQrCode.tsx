import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'
import React from 'react'
import { View, Text, Button, useTheme } from '@avalabs/k2-alpine'
import QRCode from 'react-native-qrcode-svg'
import { useTotpContext } from 'new/contexts/TotpProvider'

const qrCodeContainerSize = 260
const qrCodeSize = qrCodeContainerSize - 40

export default function ScanQrCode(): JSX.Element {
  const { goToVerifyCode, goToEnterCodeManually, totpChallenge } =
    useTotpContext()
  const {
    theme: { colors }
  } = useTheme()

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
            Scan QR code
          </Text>
          <Text variant="body1" sx={{ marginBottom: 40 }}>
            Open any authenticator app and scan the QR code below or enter the
            code manually
          </Text>

          <View
            sx={{
              marginTop: 54,
              marginBottom: 24,
              borderWidth: 32,
              height: qrCodeContainerSize,
              width: qrCodeContainerSize,
              borderColor: colors.$surfacePrimary,
              alignItems: 'center',
              alignSelf: 'center'
            }}>
            <QRCode
              ecl={'H'}
              size={qrCodeSize}
              value={totpChallenge?.totpUrl}
            />
          </View>

          <Button
            type="secondary"
            size="medium"
            style={{ width: 220, alignSelf: 'center' }}
            onPress={goToEnterCodeManually}>
            Enter code manually
          </Button>
        </View>
        <View sx={{ gap: 16, marginBottom: 36 }}>
          <Button type="primary" size="large" onPress={goToVerifyCode}>
            Next
          </Button>
        </View>
      </View>
    </BlurredBarsContentLayout>
  )
}
