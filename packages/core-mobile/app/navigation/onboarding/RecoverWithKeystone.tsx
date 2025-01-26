import React, { createContext, Dispatch, useState, useContext } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { Link } from 'expo-router'
import { Dimensions } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'
import { getModalOptions, MainHeaderOptions } from 'navigation/NavUtils'
import { View, Text } from '@avalabs/k2-mobile'
import Logger from 'utils/Logger'
import { KeystoneQrScannerAva } from 'components/KeystoneQrScannerAva'
import KeytoneSDK, { URType, UR } from '@keystonehq/keystone-sdk'
import AvaText from 'components/AvaText'
import { useWallet } from 'hooks/useWallet'
import { fromPublicKey } from 'bip32'
import { NameYourWallet } from 'seedless/screens/NameYourWallet'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useDispatch } from 'react-redux'
import { setWalletName } from 'store/account'
import CreatePIN from 'screens/onboarding/CreatePIN'
import BiometricLogin from 'screens/onboarding/BiometricLogin'
import TermsNConditionsModal from 'components/TermsNConditionsModal'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { WalletType } from 'services/wallet/types'
import OwlLoader from 'components/OwlLoader'
import { KEYSTONE_MNEMONIC_STUB } from 'keystone/consts'
import { Sheet } from 'components/Sheet'
import QrError from 'assets/icons/qr_error.svg'
import LinkSVG from 'components/svg/LinkSVG'
import AvaButton from 'components/AvaButton'
import { Space } from 'components/Space'
import { RecoverWithKeystoneScreenProps } from '../types'

interface KeystoneWalletInfo {
  mfp: string
  xpub: string
  xpubXP: string
}

export type RecoverWithKeystoneParamList = {
  [AppNavigation.RecoveryKeystoneScreens.ScanQrCode]: undefined
  [AppNavigation.RecoveryKeystoneScreens.NameYourWallet]: undefined
  [AppNavigation.RecoveryKeystoneScreens.CreatePin]: undefined
  [AppNavigation.RecoveryKeystoneScreens.BiometricLogin]: undefined
  [AppNavigation.RecoveryKeystoneScreens.TermsNConditions]: undefined
  [AppNavigation.RecoveryKeystoneScreens.Loader]: undefined
}

const RecoverWithKeystoneS =
  createStackNavigator<RecoverWithKeystoneParamList>()

type RecoverWithKeystoneContextState = {
  keystoneWallet: Nullable<KeystoneWalletInfo>
  setKeystoneWallet: Dispatch<KeystoneWalletInfo>
}

const RecoverWithKeystoneContext = createContext(
  {} as RecoverWithKeystoneContextState
)

const RecoverWithKeystone: () => JSX.Element = () => {
  const [keystoneWallet, setKeystoneWallet] =
    useState<Nullable<KeystoneWalletInfo>>(null)

  return (
    <RecoverWithKeystoneContext.Provider
      value={{ keystoneWallet, setKeystoneWallet }}>
      <RecoverWithKeystoneS.Navigator>
        <RecoverWithKeystoneS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.RecoveryKeystoneScreens.ScanQrCode}
          component={KeystoneScanner}
        />
        <RecoverWithKeystoneS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.RecoveryKeystoneScreens.NameYourWallet}
          component={NameYourWalletScreen}
        />
        <RecoverWithKeystoneS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.RecoveryKeystoneScreens.CreatePin}
          component={CreatePinScreen}
        />
        <RecoverWithKeystoneS.Screen
          name={AppNavigation.RecoveryKeystoneScreens.BiometricLogin}
          component={BiometricLoginScreen}
        />
        <RecoverWithKeystoneS.Screen
          options={{
            ...getModalOptions()
          }}
          name={AppNavigation.RecoveryKeystoneScreens.TermsNConditions}
          component={TermsNConditionsModalScreen}
        />
        <RecoverWithKeystoneS.Screen
          name={AppNavigation.RecoveryKeystoneScreens.Loader}
          component={OwlLoader}
        />
      </RecoverWithKeystoneS.Navigator>
    </RecoverWithKeystoneContext.Provider>
  )
}

type NameYourWalletNavigationProp = RecoverWithKeystoneScreenProps<
  typeof AppNavigation.RecoveryKeystoneScreens.NameYourWallet
>['navigation']

const NameYourWalletScreen = (): JSX.Element => {
  const dispatch = useDispatch()
  const { navigate } = useNavigation<NameYourWalletNavigationProp>()

  const onSetWalletName = (name: string): void => {
    AnalyticsService.capture('RecoverWithKeystone:WalletNameSet')
    dispatch(setWalletName(name))
    navigate(AppNavigation.RecoveryKeystoneScreens.CreatePin)
  }
  return <NameYourWallet onSetWalletName={onSetWalletName} />
}

type CreatePinNavigationProp = RecoverWithKeystoneScreenProps<
  typeof AppNavigation.RecoveryKeystoneScreens.CreatePin
>['navigation']

const CreatePinScreen = (): JSX.Element => {
  const { onPinCreated } = useWallet()
  const { navigate } = useNavigation<CreatePinNavigationProp>()

  const onPinSet = (pin: string): void => {
    AnalyticsService.capture('OnboardingPasswordSet')
    onPinCreated(KEYSTONE_MNEMONIC_STUB, pin, false)
      .then(value => {
        switch (value) {
          case 'useBiometry': {
            navigate(AppNavigation.RecoveryKeystoneScreens.BiometricLogin)
            break
          }
          case 'enterWallet': {
            navigate(AppNavigation.RecoveryKeystoneScreens.TermsNConditions)
            break
          }
        }
      })
      .catch(Logger.error)
  }
  return <CreatePIN onPinSet={onPinSet} />
}

type BiometricLoginNavigationProp = RecoverWithKeystoneScreenProps<
  typeof AppNavigation.RecoveryKeystoneScreens.BiometricLogin
>['navigation']

const BiometricLoginScreen = (): JSX.Element => {
  const { navigate } = useNavigation<BiometricLoginNavigationProp>()

  return (
    <BiometricLogin
      mnemonic={KEYSTONE_MNEMONIC_STUB}
      onBiometrySet={() => {
        navigate(AppNavigation.RecoveryKeystoneScreens.TermsNConditions)
      }}
      onSkip={() => {
        navigate(AppNavigation.RecoveryKeystoneScreens.TermsNConditions)
      }}
    />
  )
}

const TermsNConditionsModalScreen = (): JSX.Element => {
  const context = useContext(RecoverWithKeystoneContext)
  const { login } = useWallet()
  const { signOut } = useApplicationContext().appHook
  const { navigate } = useNavigation<BiometricLoginNavigationProp>()

  return (
    <TermsNConditionsModal
      onNext={() => {
        navigate(AppNavigation.RecoveryKeystoneScreens.Loader)
        setTimeout(() => {
          if (context.keystoneWallet) {
            login(
              KEYSTONE_MNEMONIC_STUB,
              WalletType.KEYSTONE,
              context.keystoneWallet.xpub,
              context.keystoneWallet.xpubXP,
              context.keystoneWallet.mfp
            )
          }
        }, 300)
      }}
      onReject={() => signOut()}
    />
  )
}

type ScannerNavigationProp = RecoverWithKeystoneScreenProps<
  typeof AppNavigation.RecoveryKeystoneScreens.ScanQrCode
>['navigation']

const KeystoneScanner = (): JSX.Element => {
  const { theme } = useApplicationContext()
  const { setKeystoneWallet } = useContext(RecoverWithKeystoneContext)
  const { navigate } = useNavigation<ScannerNavigationProp>()
  const [errorInfo, setErrorInfo] = useState<
    Nullable<{
      title: string
      message: string
    }>
  >(null)

  return (
    <>
      <AvaText.LargeTitleBold testID="recovery_keystone_header">
        Scan the QR Code
      </AvaText.LargeTitleBold>
      <View
        style={{
          padding: 16,
          marginBottom: 180,
          alignItems: 'center',
          flex: 1
        }}>
        <KeystoneQrScannerAva
          urTypes={[URType.CryptoMultiAccounts]}
          onSuccess={(ur: UR) => {
            try {
              const sdk = new KeytoneSDK()
              const accounts = sdk.parseMultiAccounts(ur)
              const mfp = accounts.masterFingerprint
              const ethAccount = accounts.keys.find(key => key.chain === 'ETH')
              const avaxAccount = accounts.keys.find(
                key => key.chain === 'AVAX'
              )
              if (!ethAccount || !avaxAccount) {
                throw new Error('No ETH or AVAX account found')
              }
              setKeystoneWallet({
                mfp,
                xpub: fromPublicKey(
                  Buffer.from(ethAccount.publicKey, 'hex'),
                  Buffer.from(ethAccount.chainCode, 'hex')
                ).toBase58(),
                xpubXP: fromPublicKey(
                  Buffer.from(avaxAccount.publicKey, 'hex'),
                  Buffer.from(avaxAccount.chainCode, 'hex')
                ).toBase58()
              })

              navigate(AppNavigation.RecoveryKeystoneScreens.NameYourWallet)
            } catch (error) {
              setErrorInfo({
                title: 'Error',
                message: 'Invalid QR code'
              })
            }
          }}
          onError={setErrorInfo}
          info="Place the QR code from your Keystone device in front of the camera."
        />
      </View>
      {errorInfo && (
        <Sheet
          title={errorInfo.title}
          onClose={() => setErrorInfo(null)}
          snapPoints={['65%']}>
          <View
            sx={{
              alignItems: 'center'
            }}>
            <AvaText.Body1>{errorInfo.message}</AvaText.Body1>
            <Space y={80} />
            <QrError />
            <Space y={80} />
            <AvaButton.PrimaryLarge
              style={{
                width: Dimensions.get('window').width - 32
              }}
              onPress={() => setErrorInfo(null)}>
              Try Again
            </AvaButton.PrimaryLarge>
            <Link
              href="https://keyst.one"
              style={{
                marginTop: 32,
                paddingVertical: 15
              }}>
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8
                }}>
                <Text
                  style={{
                    color: theme.colorPrimary1
                  }}
                  variant="buttonSmall">
                  Keystone Support
                </Text>
                <LinkSVG />
              </View>
            </Link>
          </View>
        </Sheet>
      )}
    </>
  )
}

export default RecoverWithKeystone
