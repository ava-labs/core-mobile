import { Button, Text, View } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import React from 'react'
import { Dimensions } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

type ScanQrCodeScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.ScanQrCode
>

const { width: screenWidth } = Dimensions.get('window')

export const ScanQrCode = (): JSX.Element => {
  const qrCodeContainerSize = screenWidth - 96
  const qrCodeSize = qrCodeContainerSize - 40

  const { navigate } = useNavigation<ScanQrCodeScreenProps['navigation']>()

  const openVerifyCode = (): void => {
    navigate(AppNavigation.RecoveryMethods.VerifyCode)
  }

  const goToAuthenticatorSetup = (): void => {
    navigate(AppNavigation.RecoveryMethods.AuthenticatorSetup)
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
          <Text
            variant="body1"
            sx={{ color: '$neutral50', marginTop: 32 }}
            onPress={goToAuthenticatorSetup}>
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
          <QRCode ecl={'H'} size={qrCodeSize} value={'TO_BE_IMPLEMENTED'} />
        </View>
        <Button type="tertiary" size="xlarge">
          Enter Code Manually
        </Button>
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
