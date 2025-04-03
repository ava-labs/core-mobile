import React, { FC, useCallback, useEffect, useState } from 'react'
import { View } from '@avalabs/k2-mobile'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import QRCode from 'react-native-qrcode-svg'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { Sheet } from 'components/Sheet'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import KeystoneLogo from 'assets/icons/keystone_logo.svg'
import { Space } from 'components/Space'
import { Dimensions } from 'react-native'
import { KeystoneQrScannerAva } from 'components/KeystoneQrScannerAva'
import { UREncoder } from '@ngraveio/bc-ur'

type KeystoneSignerScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.KeystoneSigner
>

enum KeystoneSignerStep {
  QR,
  Scanner
}

export const KeystoneSignerScreen: FC = () => {
  const { goBack } = useNavigation<KeystoneSignerScreenProps['navigation']>()
  const { onReject, requesrUR } =
    useRoute<KeystoneSignerScreenProps['route']>().params
  const [currentStep, setCurrentStep] = useState(KeystoneSignerStep.QR)
  const [signningUr, setSigningUr] = useState<string>('(null)')

  useEffect(() => {
    const urEncoder = new UREncoder(requesrUR, 200)
    const timer = setInterval(() => {
      setSigningUr(urEncoder.nextPart())
    }, 200)
    return () => {
      clearInterval(timer)
    }
  }, [requesrUR])

  const rejectAndClose = useCallback(
    (message?: string) => {
      onReject(message)
      goBack()
    },
    [goBack, onReject]
  )

  return (
    <Sheet
      snapPoints={['100%']}
      onClose={() => {
        rejectAndClose()
      }}>
      {currentStep === KeystoneSignerStep.Scanner && (
        <>
          <AvaText.LargeTitleBold testID="keystone_scanner_header">
            Scan the QR Code
          </AvaText.LargeTitleBold>
          <QRScanner />
        </>
      )}
      {currentStep === KeystoneSignerStep.QR && (
        <View
          sx={{
            alignItems: 'center',
            paddingHorizontal: 16
          }}>
          <QRRenderer data={signningUr.toUpperCase()} />
          <AvaButton.PrimaryLarge
            style={{
              width: Dimensions.get('window').width - 32,
              marginTop: 20
            }}
            onPress={() => setCurrentStep(KeystoneSignerStep.Scanner)}>
            Get Signature
          </AvaButton.PrimaryLarge>
        </View>
      )}
    </Sheet>
  )
}

const { width: screenWidth } = Dimensions.get('window')

const QRRenderer: FC<{
  data: string
}> = ({ data }) => {
  const { theme } = useApplicationContext()
  const borderWidth = 16
  const containerSize = screenWidth * 0.7
  const qrCodeSize = containerSize - borderWidth * 2

  return (
    <>
      <KeystoneLogo />
      <Space y={20} />
      <AvaText.LargeTitleBold>Scan the QR Code</AvaText.LargeTitleBold>
      <Space y={12} />
      <AvaText.Body1
        textStyle={{
          textAlign: 'center'
        }}>
        Scan the QR code via your Keystone device
      </AvaText.Body1>
      <View
        style={{
          borderWidth: borderWidth,
          height: containerSize,
          borderColor: theme.alternateBackground,
          borderRadius: 7,
          marginTop: 20,
          marginBottom: 24
        }}>
        <QRCode value={data} ecl={'H'} size={qrCodeSize} />
      </View>
      <AvaText.Body1
        textStyle={{
          textAlign: 'center'
        }}>
        Click on the 'Get Signature' button after signing the transaction with
        your Keystone device.
      </AvaText.Body1>
    </>
  )
}

const QRScanner: FC = () => {
  const { goBack } = useNavigation<KeystoneSignerScreenProps['navigation']>()
  const { onApprove, onReject, responseURTypes } =
    useRoute<KeystoneSignerScreenProps['route']>().params

  return (
    <View
      style={{
        marginBottom: 180,
        alignItems: 'center',
        flex: 1
      }}>
      <KeystoneQrScannerAva
        urTypes={responseURTypes}
        onSuccess={ur => onApprove(ur.cbor).finally(goBack)}
        onError={err => onReject(err.message)}
        info={
          'Place the QR code from your Keystone device in front of the camera.'
        }
      />
    </View>
  )
}
