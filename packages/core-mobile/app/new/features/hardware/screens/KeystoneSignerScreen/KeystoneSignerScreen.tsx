import { Button, Text, useTheme, View } from '@avalabs/k2-alpine'
import React, { FC, useCallback, useEffect, useState } from 'react'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { KeystoneSignerParams } from 'services/walletconnectv2/walletConnectCache/types'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { router, useNavigation } from 'expo-router'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { UREncoder } from '@ngraveio/bc-ur'
import { Space } from 'common/components/Space'
import QRCode from 'react-native-qrcode-svg'
import { Dimensions, BackHandler } from 'react-native'
import { KeystoneQrScanner } from 'common/components/KeystoneQrScanner'
import KeystoneLogoLight from 'assets/icons/keystone_logo_light.svg'
import KeystoneLogoDark from 'assets/icons/keystone_logo_dark.svg'

export const requestKeystoneSigner = (params: KeystoneSignerParams): void => {
  walletConnectCache.keystoneSignerParams.set(params)

  router.navigate({
    // @ts-ignore
    pathname: '/keystoneSigner'
  })
}

enum KeystoneSignerStep {
  QR,
  Scanner
}

const KeystoneSignerScreen = ({
  params
}: {
  params: KeystoneSignerParams
}): JSX.Element => {
  const navigation = useNavigation()
  const { request, responseURTypes, onApprove, onReject } = params
  const [currentStep, setCurrentStep] = useState(KeystoneSignerStep.QR)
  const [signningUr, setSigningUr] = useState<string>('(null)')

  useEffect(() => {
    const urEncoder = new UREncoder(request, 150)
    const timer = setInterval(() => {
      setSigningUr(urEncoder.nextPart())
    }, 200)
    return () => {
      clearInterval(timer)
    }
  }, [request])

  const rejectAndClose = useCallback(
    (message?: string) => {
      onReject(message)
      navigation.goBack()
    },
    [navigation, onReject]
  )

  useEffect(() => {
    const onBackPress = (): boolean => {
      // modal is being dismissed via physical back button
      rejectAndClose()
      return false
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    )

    return () => backHandler.remove()
  }, [rejectAndClose])

  useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      if (
        e.data.action.type === 'POP' // gesture dismissed
      ) {
        // modal is being dismissed via gesture or back button
        rejectAndClose()
      }
    })
  }, [navigation, rejectAndClose])

  return (
    <ScrollScreen
      isModal
      titleSx={{
        maxWidth: '80%'
      }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: 0
      }}>
      <View
        sx={{
          alignItems: 'center',
          paddingHorizontal: 16
        }}>
        {currentStep === KeystoneSignerStep.QR && (
          <>
            <QRRenderer data={signningUr.toUpperCase()} />
            <Button
              size="large"
              type="primary"
              style={{
                marginTop: 36
              }}
              onPress={() => setCurrentStep(KeystoneSignerStep.Scanner)}>
              Get Signature
            </Button>
          </>
        )}
        {currentStep === KeystoneSignerStep.Scanner && (
          <>
            <Header>Scan the QR Code</Header>
            <QRScanner
              responseURTypes={responseURTypes}
              onApprove={onApprove}
            />
          </>
        )}
      </View>
    </ScrollScreen>
  )
}

const { width: screenWidth } = Dimensions.get('window')

const Header: FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { theme } = useTheme()

  return (
    <>
      {theme.isDark ? <KeystoneLogoDark /> : <KeystoneLogoLight />}
      <Space y={20} />
      <Text variant="heading2">{children}</Text>
      <Space y={36} />
    </>
  )
}

const QRRenderer: FC<{
  data: string
}> = ({ data }) => {
  const { theme } = useTheme()
  const borderWidth = 16
  const containerSize = screenWidth * 0.7
  const qrCodeSize = containerSize - borderWidth * 2

  return (
    <>
      <Header>Scan the QR Code</Header>
      <Text variant="body1">Scan the QR code via your Keystone device</Text>
      <View
        style={{
          borderWidth: borderWidth,
          height: containerSize,
          borderColor: theme.colors.$white,
          borderRadius: 7,
          marginVertical: 36
        }}>
        <QRCode
          value={data}
          ecl={'H'}
          size={qrCodeSize}
          color={theme.colors.$textPrimary}
          backgroundColor={theme.colors.$surfacePrimary}
        />
      </View>
      <Text variant="body1">
        Click on the 'Get Signature' button after signing the transaction with
        your Keystone device.
      </Text>
    </>
  )
}

const QRScanner: FC<Omit<KeystoneSignerParams, 'request' | 'onReject'>> = ({
  onApprove,
  responseURTypes
}) => {
  const navigation = useNavigation()

  return (
    <View
      style={{
        marginBottom: 180,
        alignItems: 'center',
        flex: 1
      }}>
      <KeystoneQrScanner
        urTypes={responseURTypes}
        onSuccess={ur => onApprove(ur.cbor).finally(navigation.goBack)}
        info={
          'Place the QR code from your Keystone device in front of the camera.'
        }
      />
    </View>
  )
}

export default withWalletConnectCache('keystoneSignerParams')(
  KeystoneSignerScreen
)
