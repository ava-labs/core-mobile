import React, { memo } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
import CreatePIN from 'screens/onboarding/CreatePIN'
import SecurityPrivacy from 'screens/drawer/security/SecurityPrivacy'
import {
  NavigatorScreenParams,
  useNavigation,
  useRoute
} from '@react-navigation/native'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { createStackNavigator } from '@react-navigation/stack'
import BiometricsSDK from 'utils/BiometricsSDK'
import RevealMnemonic from 'navigation/wallet/RevealMnemonic'
import { QRCodeParams, SecurityPrivacyScreenProps } from 'navigation/types'
import ConnectedDapps from 'screens/rpc/ConnectedDapps/ConnectedDapps'
import CaptureDappQR from 'screens/shared/CaptureDappQR'
import Logger from 'utils/Logger'
import { useWallet } from 'hooks/useWallet'
import { WalletType } from 'services/wallet/types'
import walletService from 'services/wallet/WalletService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import SeedlessExportStack, {
  SeedlessExportStackParamList
} from './SeedlessExportStack'
import SettingRecoveryMethodsStack from './SettingRecoveryMethodsStack'

export type SecurityStackParamList = {
  [AppNavigation.SecurityPrivacy.SecurityPrivacy]: undefined
  [AppNavigation.SecurityPrivacy.PinChange]: undefined
  [AppNavigation.SecurityPrivacy.CreatePin]: { mnemonic: string }
  [AppNavigation.SecurityPrivacy.ShowRecoveryPhrase]: undefined
  [AppNavigation.SecurityPrivacy.SettingRecoveryMethods]: undefined
  [AppNavigation.SecurityPrivacy.TurnOnBiometrics]: undefined
  [AppNavigation.SecurityPrivacy.RecoveryPhrase]: { mnemonic: string }
  [AppNavigation.SecurityPrivacy.DappList]: undefined
  [AppNavigation.SecurityPrivacy.QRCode]: QRCodeParams
  [AppNavigation.SecurityPrivacy
    .SeedlessExport]: NavigatorScreenParams<SeedlessExportStackParamList>
}

const SecurityStack = createStackNavigator<SecurityStackParamList>()

function SecurityPrivacyStackScreen(): JSX.Element {
  return (
    <SecurityStack.Navigator
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal'
      }}>
      <SecurityStack.Group>
        <SecurityStack.Screen
          options={MainHeaderOptions({
            title: 'Security & Privacy',
            headerBackTestID: 'header_back'
          })}
          name={AppNavigation.SecurityPrivacy.SecurityPrivacy}
          component={SecurityPrivacyScreen}
        />
        <SecurityStack.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.SecurityPrivacy.DappList}
          component={DappConnectionsList}
        />
        <SecurityStack.Screen
          options={{ headerShown: false }}
          name={AppNavigation.SecurityPrivacy.SettingRecoveryMethods}
          component={SettingRecoveryMethodsStack}
        />
        <SecurityStack.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.SecurityPrivacy.QRCode}
          component={CaptureDappQR}
        />
        <SecurityStack.Screen
          options={{ headerShown: false }}
          name={AppNavigation.SecurityPrivacy.SeedlessExport}
          component={SeedlessExportStack}
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
          component={RecoveryPhraseNavigation}
        />
      </SecurityStack.Group>
    </SecurityStack.Navigator>
  )
}

type SecurityPrivacyNavigationProp = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.SecurityPrivacy
>['navigation']

const SecurityPrivacyScreen = (): JSX.Element => {
  const nav = useNavigation<SecurityPrivacyNavigationProp>()
  const walletType = walletService.walletType

  return (
    <SecurityPrivacy
      onChangePin={() => {
        AnalyticsService.capture('ChangePasswordClicked')
        nav.navigate(AppNavigation.SecurityPrivacy.PinChange)
      }}
      onShowRecoveryPhrase={() => {
        if (walletType === WalletType.SEEDLESS) {
          nav.navigate(AppNavigation.SecurityPrivacy.SeedlessExport, {
            screen: AppNavigation.SeedlessExport.InitialScreen
          })
          return
        }
        nav.navigate(AppNavigation.SecurityPrivacy.ShowRecoveryPhrase)
      }}
      onRecoveryMethods={() => {
        nav.navigate(AppNavigation.SecurityPrivacy.SettingRecoveryMethods)
      }}
      onTurnOnBiometrics={() =>
        nav.navigate(AppNavigation.SecurityPrivacy.TurnOnBiometrics)
      }
      onShowConnectedDapps={() => {
        AnalyticsService.capture('ConnectedSitesClicked')
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

  const handleOnResetPinFailed = (): void => {
    AnalyticsService.capture('ChangePasswordFailed')
  }

  return (
    <CreatePIN
      onPinSet={pin => {
        onPinCreated(mnemonic, pin, true)
          .then(() => {
            AnalyticsService.capture('ChangePasswordSucceeded')
            nav.goBack()
          })
          .catch(Logger.error)
      }}
      isResettingPin
      onResetPinFailed={handleOnResetPinFailed}
    />
  )
})

type RecoveryPhraseNavigationProp = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.RecoveryPhrase
>
const RecoveryPhraseNavigation = memo(() => {
  const { goBack } = useNavigation<RecoveryPhraseNavigationProp['navigation']>()
  const { mnemonic } = useRoute<RecoveryPhraseNavigationProp['route']>().params

  return (
    <RevealMnemonic
      mnemonic={mnemonic}
      buttonText="I wrote it down"
      onGoBack={goBack}
    />
  )
})

export default SecurityPrivacyStackScreen
