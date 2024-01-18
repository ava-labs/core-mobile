import React, { FC, useCallback, useEffect, useState } from 'react'
import OnboardScreenStack, {
  OnboardingScreenStackParamList
} from 'navigation/OnboardScreenStack'
import { createStackNavigator } from '@react-navigation/stack'
import { Alert, Vibration } from 'react-native'
import {
  NavigatorScreenParams,
  useNavigation,
  useRoute
} from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import WalletScreenStack, {
  WalletScreenStackParams
} from 'navigation/WalletScreenStack/WalletScreenStack'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSelector } from 'react-redux'
import { selectWalletState, WalletState, selectIsReady } from 'store/app'
import { useBgDetect } from 'navigation/useBgDetect'
import { RootStackScreenProps } from 'navigation/types'
import WarningModal from 'components/WarningModal'
import RefreshTokenScreenStack, {
  RefreshTokenScreenStackParamList
} from 'navigation/RefreshTokenScreenStack'
import ForgotPinModal from 'screens/shared/ForgotPinModal'
import { useWallet } from 'hooks/useWallet'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
import Logger from 'utils/Logger'
import { setPinRecovery } from 'utils/Navigation'
import { PrivacyScreen } from './wallet/PrivacyScreen'

export type RootScreenStackParamList = {
  [AppNavigation.Root
    .Onboard]: NavigatorScreenParams<OnboardingScreenStackParamList>
  [AppNavigation.Root
    .RefreshToken]: NavigatorScreenParams<RefreshTokenScreenStackParamList>
  [AppNavigation.Root.Wallet]: NavigatorScreenParams<WalletScreenStackParams>
  [AppNavigation.Root.CopyPhraseWarning]: {
    copy: () => void
  }
  [AppNavigation.Root.ForgotPin]: {
    onConfirm: () => void
    title: string
    message: string
  }
}

const RootStack = createStackNavigator<RootScreenStackParamList>()

const WalletScreenStackWithContext: FC = () => {
  const { onExit } = useApplicationContext().appHook
  const { inBackground } = useBgDetect()
  const walletState = useSelector(selectWalletState)
  const appIsReady = useSelector(selectIsReady)
  const [shouldRenderOnlyPinScreen, setShouldRenderOnlyPinScreen] =
    useState(true)

  useEffect(() => {
    // set shouldRenderOnlyPinScreen to false once wallet is unlocked
    // do nothing if app is not ready (as we need to sync wallet state after rehydration)
    // or if we have already set shouldRenderOnlyPinScreen to false
    if (!appIsReady) return
    if (!shouldRenderOnlyPinScreen) return

    if (walletState === WalletState.ACTIVE) {
      setShouldRenderOnlyPinScreen(false)
    }
  }, [walletState, shouldRenderOnlyPinScreen, appIsReady])

  const doExit = useCallback(() => {
    onExit((confirmExit, cancel) => {
      Alert.alert(
        'Exit app?',
        'Your passphrase will remain securely stored for easier later access of wallet.',
        [
          {
            text: 'Ok',
            onPress: confirmExit
          },
          {
            text: 'Cancel',
            onPress: cancel,
            style: 'cancel'
          }
        ]
      )
    })
  }, [onExit])

  // on fresh app open, we render only pin screen
  // we only render the wallet stack once user has unlocked the wallet
  if (shouldRenderOnlyPinScreen) {
    return <LoginWithPinOrBiometryScreen />
  }

  return (
    <>
      <WalletScreenStack onExit={doExit} />
      {walletState === WalletState.INACTIVE && <LoginWithPinOrBiometryScreen />}
      {/* This protects from leaking last screen in "recent apps" list.                                 */}
      {/* For Android it is additionally implemented natively in MainActivity.java because react-native */}
      {/* isn't fast enough to change layout before system makes screenshot of app for recent apps list */}
      {inBackground && <PrivacyScreen />}
    </>
  )
}

const RootScreenStack: FC = () => {
  const walletState = useSelector(selectWalletState)

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false
      }}>
      {walletState === WalletState.NONEXISTENT ? (
        <RootStack.Screen
          name={AppNavigation.Root.Onboard}
          component={OnboardScreenStack}
          options={{
            animationEnabled: false
          }}
        />
      ) : (
        <RootStack.Screen
          name={AppNavigation.Root.Wallet}
          component={WalletScreenStackWithContext}
          options={{
            animationEnabled: false,
            presentation: 'card'
          }}
        />
      )}
      <RootStack.Screen
        name={AppNavigation.Root.RefreshToken}
        component={RefreshTokenScreenStack}
        options={{
          animationEnabled: false
        }}
      />
      <RootStack.Group screenOptions={{ presentation: 'transparentModal' }}>
        <RootStack.Screen
          name={AppNavigation.Root.CopyPhraseWarning}
          component={CopyPhraseWarningModal}
        />
        <RootStack.Screen
          name={AppNavigation.Root.ForgotPin}
          component={ForgotPinModal}
        />
      </RootStack.Group>
    </RootStack.Navigator>
  )
}

const LoginWithPinOrBiometryScreen = (): JSX.Element => {
  const { unlock } = useWallet()
  const { signOut } = useApplicationContext().appHook

  return (
    <PinOrBiometryLogin
      onSignOut={signOut}
      onSignInWithRecoveryPhrase={() => {
        setPinRecovery(true)
        signOut()
      }}
      onLoginSuccess={mnemonic => {
        unlock({ mnemonic }).catch(Logger.error)
      }}
    />
  )
}

type CopyPhraseWarningNavigationProp = RootStackScreenProps<
  typeof AppNavigation.Root.CopyPhraseWarning
>

const CopyPhraseWarningModal: FC = () => {
  const { goBack } =
    useNavigation<CopyPhraseWarningNavigationProp['navigation']>()
  const { params } = useRoute<CopyPhraseWarningNavigationProp['route']>()

  useEffect(() => {
    Vibration.vibrate()
  }, [])

  const onCopy = (): void => {
    goBack()
    params.copy()
  }

  const onCancel = (): void => {
    goBack()
  }

  return (
    <WarningModal
      title={'Security Warning'}
      message={
        'Copying your phrase can expose it to other apps on your device. It is best to write down your phrase instead.'
      }
      actionText={'Copy Anyway'}
      dismissText={'Cancel'}
      onAction={onCopy}
      onDismiss={onCancel}
      testID="create_wallet_stack__copy_phrase_modal"
    />
  )
}

export default RootScreenStack
