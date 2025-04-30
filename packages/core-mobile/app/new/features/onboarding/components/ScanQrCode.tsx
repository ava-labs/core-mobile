import { Button, View } from '@avalabs/k2-alpine'
import { TotpChallenge } from '@cubist-labs/cubesigner-sdk'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback } from 'react'
import QRCode from 'react-native-qrcode-svg'

const qrCodeContainerSize = 260
const qrCodeSize = qrCodeContainerSize - 40

export const ScanQrCode = ({
  totpChallenge,
  onEnterCodeManually,
  onVerifyCode
}: {
  totpChallenge?: TotpChallenge
  onEnterCodeManually: () => void
  onVerifyCode: () => void
}): JSX.Element => {
  const renderFooter = useCallback(() => {
    return (
      <Button type="primary" size="large" onPress={onVerifyCode}>
        Next
      </Button>
    )
  }, [onVerifyCode])

  return (
    <ScrollScreen
      title="Scan QR code"
      subtitle="Open any authenticator app and scan the QR code below or enter the code manually"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View
        sx={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24
        }}>
        <QRCode ecl={'H'} size={qrCodeSize} value={totpChallenge?.url} />
        <Button
          type="secondary"
          size="medium"
          style={{ width: 220, alignSelf: 'center' }}
          onPress={onEnterCodeManually}>
          Enter code manually
        </Button>
      </View>
    </ScrollScreen>
  )
}
