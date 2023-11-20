import { Button, Text, View } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import React, { useEffect } from 'react'
import { Dimensions } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'

type ScanQrCodeScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.ScanQrCode
>

const { width: screenWidth } = Dimensions.get('window')

const qrCodeContainerSize = screenWidth - 96
const qrCodeSize = qrCodeContainerSize - 40

export const ScanQrCode = (): JSX.Element => {
  const { navigate } = useNavigation<ScanQrCodeScreenProps['navigation']>()
  const [totpUrl, setTotpUrl] = React.useState<string>()

  const openVerifyCode = (): void => {
    navigate(AppNavigation.RecoveryMethods.VerifyCode)
  }

  const goToAuthenticatorSetup = (): void => {
    navigate(AppNavigation.RecoveryMethods.AuthenticatorSetup)
  }

  useEffect(() => {
    const getTotpUrl = async (): Promise<void> => {
      const result = await SeedlessService.setTotp()
      if (result.success && result.value) {
        setTotpUrl(result.value)
      }
    }
    getTotpUrl().catch(reason => {
      Logger.error('ScanQrCode AuthenticatorService.setTotp error', reason)
    })
  }, [])

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

        <View
          sx={{
            marginVertical: 24,
            borderWidth: 32,
            height: qrCodeContainerSize,
            width: qrCodeContainerSize,
            borderColor: '$white',
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            alignSelf: 'center'
          }}>
          {!!totpUrl && <QRCode ecl={'H'} size={qrCodeSize} value={totpUrl} />}
        </View>
        <Button type="tertiary" size="xlarge" onPress={goToAuthenticatorSetup}>
          Enter Code Manually
        </Button>
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
