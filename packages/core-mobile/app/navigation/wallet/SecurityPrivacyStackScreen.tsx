import React, { memo } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
import CreatePIN from 'screens/onboarding/CreatePIN'
import SecurityPrivacy from 'screens/drawer/security/SecurityPrivacy'
import { useNavigation, useRoute } from '@react-navigation/native'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { createStackNavigator } from '@react-navigation/stack'
import BiometricsSDK from 'utils/BiometricsSDK'
import RevealMnemonic from 'navigation/wallet/RevealMnemonic'
import { QRCodeParams, SecurityPrivacyScreenProps } from 'navigation/types'
import ConnectedDapps from 'screens/rpc/ConnectedDapps/ConnectedDapps'
import CaptureDappQR from 'screens/shared/CaptureDappQR'
import { usePostCapture } from 'hooks/usePosthogCapture'
import Logger from 'utils/Logger'
import { useWallet } from 'hooks/useWallet'

export type SecurityStackParamList = {
  [AppNavigation.SecurityPrivacy.SecurityPrivacy]: undefined
  [AppNavigation.SecurityPrivacy.PinChange]: undefined
  [AppNavigation.SecurityPrivacy.CreatePin]: { mnemonic: string }
  [AppNavigation.SecurityPrivacy.ShowRecoveryPhrase]: undefined
  [AppNavigation.SecurityPrivacy.TurnOnBiometrics]: undefined
  [AppNavigation.SecurityPrivacy.RecoveryPhrase]: { mnemonic: string }
  [AppNavigation.SecurityPrivacy.DappList]: undefined
  [AppNavigation.SecurityPrivacy.QRCode]: QRCodeParams
}

const SecurityStack = createStackNavigator<SecurityStackParamList>()

function SecurityPrivacyStackScreen(): JSX.Element {
  return (
    <SecurityStack.Navigator
      screenOptions={{
        headerBackTitleVisible: false
      }}>
      <SecurityStack.Group>
        <SecurityStack.Screen
          options={MainHeaderOptions({ title: 'Security & Privacy' })}
          name={AppNavigation.SecurityPrivacy.SecurityPrivacy}
          component={SecurityPrivacyScreen}
        />
        <SecurityStack.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.SecurityPrivacy.DappList}
          component={DappConnectionsList}
        />
        <SecurityStack.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.SecurityPrivacy.QRCode}
          component={CaptureDappQR}
        />
      </SecurityStack.Group>
      <SecurityStack.Group screenOptions={{ presentation: 'modal' }}>
        <SecurityStack.Screen
          options={MainHeaderOptions({ title: 'Enter your pin' })}
          name={AppNavigation.SecurityPrivacy.PinChange}
          component={PinOrBiometryLoginForPassChange}
        />
        <SecurityStack.Screen
          options={MainHeaderOptions({ title: 'Set new pin' })}
          name={AppNavigation.SecurityPrivacy.CreatePin}
          component={CreatePinScreen}
        />
        <SecurityStack.Screen
          options={MainHeaderOptions({ title: 'Enter your pin' })}
          name={AppNavigation.SecurityPrivacy.ShowRecoveryPhrase}
          component={PinOrBiometryLoginForRecoveryReveal}
        />
        <SecurityStack.Screen
          options={MainHeaderOptions({ title: 'Enter your pin' })}
          name={AppNavigation.SecurityPrivacy.TurnOnBiometrics}
          component={PinForBiometryEnable}
        />
        <SecurityStack.Screen
          options={MainHeaderOptions({ title: 'Recovery Phrase' })}
          name={AppNavigation.SecurityPrivacy.RecoveryPhrase}
          component={RevealMnemonic}
        />
      </SecurityStack.Group>
    </SecurityStack.Navigator>
  )
}

type SecurityPrivacyNavigationProp = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.SecurityPrivacy
>['navigation']

const SecurityPrivacyScreen = (): JSX.Element => {
  const { capture } = usePostCapture()
  const nav = useNavigation<SecurityPrivacyNavigationProp>()
  return (
    <SecurityPrivacy
      onChangePin={() => {
        capture('ChangePasswordClicked')
        nav.navigate(AppNavigation.SecurityPrivacy.PinChange)
      }}
      onShowRecoveryPhrase={() =>
        nav.navigate(AppNavigation.SecurityPrivacy.ShowRecoveryPhrase)
      }
      onTurnOnBiometrics={() =>
        nav.navigate(AppNavigation.SecurityPrivacy.TurnOnBiometrics)
      }
      onShowConnectedDapps={() => {
        capture('ConnectedSitesClicked')
        nav.navigate(AppNavigation.SecurityPrivacy.DappList)
      }}
    />
  )
}

type DappListNavigationProp = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.DappList
>['navigation']

const DappConnectionsList = memo(() => {
  const nav = useNavigation<DappListNavigationProp>()

  return (
    <ConnectedDapps
      goBack={() => {
        nav.getParent()?.goBack()
      }}
    />
  )
})

type PinChangeNavigationProp = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.PinChange
>['navigation']

const PinOrBiometryLoginForPassChange = memo(() => {
  const nav = useNavigation<PinChangeNavigationProp>()

  return (
    <PinOrBiometryLogin
      onLoginSuccess={mnemonic => {
        nav.replace(AppNavigation.SecurityPrivacy.CreatePin, { mnemonic })
      }}
      onSignInWithRecoveryPhrase={() => Logger.info('onSignIn')}
      isResettingPin
    />
  )
})

type RecoveryNavigationProp = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.ShowRecoveryPhrase
>['navigation']

const PinOrBiometryLoginForRecoveryReveal = memo(() => {
  const nav = useNavigation<RecoveryNavigationProp>()

  return (
    <PinOrBiometryLogin
      onLoginSuccess={mnemonic => {
        nav.replace(AppNavigation.SecurityPrivacy.RecoveryPhrase, { mnemonic })
      }}
      onSignInWithRecoveryPhrase={() => Logger.info('onSignIn')}
      hideLoginWithMnemonic
      isResettingPin
    />
  )
})

type TurnOnBiometricsNavigationProp = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.TurnOnBiometrics
>['navigation']

const PinForBiometryEnable = memo(() => {
  const nav = useNavigation<TurnOnBiometricsNavigationProp>()

  return (
    <PinOrBiometryLogin
      onLoginSuccess={mnemonic => {
        BiometricsSDK.storeWalletWithBiometry(mnemonic)
          .then(() =>
            nav.navigate(AppNavigation.SecurityPrivacy.SecurityPrivacy)
          )
          .catch(Logger.error)
      }}
      onSignInWithRecoveryPhrase={() => Logger.info('onSignIn')}
      isResettingPin
    />
  )
})

type CreatePinScreenProps = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.CreatePin
>

const CreatePinScreen = memo(() => {
  const { onPinCreated } = useWallet()
  const { mnemonic } = useRoute<CreatePinScreenProps['route']>().params
  const nav = useNavigation<CreatePinScreenProps['navigation']>()
  const { capture } = usePostCapture()

  const handleOnResetPinFailed = (): void => {
    capture('ChangePasswordFailed')
  }

  return (
    <CreatePIN
      onPinSet={pin => {
        onPinCreated(mnemonic, pin, true)
          .then(() => {
            capture('ChangePasswordSucceeded')
            nav.goBack()
          })
          .catch(Logger.error)
      }}
      isResettingPin
      onResetPinFailed={handleOnResetPinFailed}
    />
  )
})

export default SecurityPrivacyStackScreen
