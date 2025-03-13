import React, { FC, useCallback, useEffect, useState } from 'react'
import OnboardScreenStack, {
  OnboardingScreenStackParamList
} from 'navigation/OnboardScreenStack'
import { createStackNavigator } from '@react-navigation/stack'
import { Alert, Platform, Vibration } from 'react-native'
import {
  NavigatorScreenParams,
  useFocusEffect,
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
import { Result } from 'types/result'
import { TotpErrors } from 'seedless/errors'
import VerifyTotpCodeScreen from 'screens/shared/VerifyTotpCodeScreen'
import { MFA } from 'seedless/types'
import { SelectRecoveryMethods } from 'seedless/screens/SelectRecoveryMethods'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { CubeSignerResponse } from '@cubist-labs/cubesigner-sdk'
import { LoginWithPinOrBiometryScreen } from 'screens/login/LoginWithPinOrBiometryScreen'
import { PrivacyScreen } from './wallet/PrivacyScreen'
import RecoveryMethodsStack, {
  RecoveryMethodsStackParamList
} from './onboarding/RecoveryMethodsStack'

const DELAY = Platform.OS === 'android' ? 0 : 100

export type RootScreenStackParamList = {
  [AppNavigation.Root
    .Onboard]: NavigatorScreenParams<OnboardingScreenStackParamList>
  [AppNavigation.Root
    .RefreshToken]: NavigatorScreenParams<RefreshTokenScreenStackParamList>
  [AppNavigation.Root.Wallet]: NavigatorScreenParams<WalletScreenStackParams>
  [AppNavigation.Root.CopyPhraseWarning]: {
    copy: () => void
  }
  [AppNavigation.Root.VerifyTotpCode]: {
    onVerifyCode: <T>(
      code: string
    ) => Promise<Result<undefined | CubeSignerResponse<T>, TotpErrors>>
    onVerifySuccess: <T>(response?: T) => void
    onBack?: () => void
  }
  [AppNavigation.Root
    .RecoveryMethods]: NavigatorScreenParams<RecoveryMethodsStackParamList>
  [AppNavigation.Root.SelectRecoveryMethods]: {
    mfaMethods: MFA[]
    onMFASelected: (mfa: MFA) => void
    onBack?: () => void
  }
}

const RootStack = createStackNavigator<RootScreenStackParamList>()

const WalletScreenStackWithContext: FC = () => {
  const { onExit } = useApplicationContext().appHook
  const { inBackground } = useBgDetect()
  const walletState = useSelector(selectWalletState)
  const appIsReady = useSelector(selectIsReady)
  const [shouldRenderOnlyPinScreen, setShouldRenderOnlyPinScreen] = useState<
    null | boolean
  >(null)
  const [enabledPrivacyScreen, setEnabledPrivacyScreen] = useState(false)

  useEffect(() => {
    // set shouldRenderOnlyPinScreen to false once wallet is unlocked
    // do nothing if app is not ready (as we need to sync wallet state after rehydration)
    // or if we have already set shouldRenderOnlyPinScreen to false
    if (!appIsReady || shouldRenderOnlyPinScreen === false) return

    setShouldRenderOnlyPinScreen(walletState !== WalletState.ACTIVE)
  }, [appIsReady, shouldRenderOnlyPinScreen, walletState])

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        setEnabledPrivacyScreen(inBackground)
      }, DELAY)
    }, [inBackground])
  )

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
  // if we haven't determined what to render yet, render nothing
  if (shouldRenderOnlyPinScreen === null) return null
  if (shouldRenderOnlyPinScreen === true) {
    return <LoginWithPinOrBiometryScreen />
  }

  // we only render the wallet stack once user has unlocked the wallet
  return (
    <>
      <WalletScreenStack onExit={doExit} />
      {walletState === WalletState.INACTIVE && <LoginWithPinOrBiometryScreen />}
      {/* This protects from leaking last screen in "recent apps" list.                                 */}
      {/* For Android it is additionally implemented natively in MainActivity.java because react-native */}
      {/* isn't fast enough to change layout before system makes screenshot of app for recent apps list */}
      {enabledPrivacyScreen && <PrivacyScreen />}
    </>
  )
}

const RootScreenStack: FC = () => {
  const walletState = useSelector(selectWalletState)

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none'
      }}>
      {walletState === WalletState.NONEXISTENT ? (
        <RootStack.Screen
          name={AppNavigation.Root.Onboard}
          component={OnboardScreenStack}
        />
      ) : (
        <RootStack.Screen
          name={AppNavigation.Root.Wallet}
          component={WalletScreenStackWithContext}
          options={{
            presentation: 'card'
          }}
        />
      )}
      <RootStack.Screen
        name={AppNavigation.Root.RefreshToken}
        component={RefreshTokenScreenStack}
      />
      <RootStack.Screen
        name={AppNavigation.Root.RecoveryMethods}
        component={RecoveryMethodsStack}
      />
      <RootStack.Screen
        name={AppNavigation.Root.SelectRecoveryMethods}
        component={SelectRecoveryMethods}
        options={{
          ...MainHeaderOptions(),
          presentation: 'modal'
        }}
      />
      <RootStack.Group screenOptions={{ presentation: 'transparentModal' }}>
        <RootStack.Screen
          name={AppNavigation.Root.CopyPhraseWarning}
          component={CopyPhraseWarningModal}
        />
        <RootStack.Screen
          options={{ presentation: 'modal' }}
          name={AppNavigation.Root.VerifyTotpCode}
          component={VerifyTotpCodeScreen}
        />
      </RootStack.Group>
    </RootStack.Navigator>
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
