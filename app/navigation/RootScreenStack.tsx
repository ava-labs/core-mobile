import React from 'react'
import {
  OnboardingScreenStackParamList,
  OnboardScreenStack
} from 'navigation/OnboardScreenStack'
import { createStackNavigator } from '@react-navigation/stack'
import { Alert, View } from 'react-native'
import { NavigatorScreenParams } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import WalletScreenStack, {
  WalletScreenStackParams
} from 'navigation/WalletScreenStack/WalletScreenStack'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { ExitEvents, ExitPromptAnswers, ShowExitPrompt } from 'AppHook'
import {
  NoWalletScreenStack,
  NoWalletScreenStackParams
} from 'navigation/NoWalletScreenStack'
import OwlSVG from 'components/svg/OwlSVG'
import { useDispatch, useSelector } from 'react-redux'
import { onAppUnlocked, selectIsLocked } from 'store/app'
import { useBgDetect } from 'navigation/useBgDetect'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'

export type RootScreenStackParamList = {
  [AppNavigation.Root
    .Onboard]: NavigatorScreenParams<OnboardingScreenStackParamList>
  [AppNavigation.Root.Wallet]: NavigatorScreenParams<WalletScreenStackParams>
  [AppNavigation.Root
    .NoWallet]: NavigatorScreenParams<NoWalletScreenStackParams>
}

const onOk = (value: ShowExitPrompt): void => {
  value.prompt.next(ExitPromptAnswers.Ok)
  value.prompt.complete()
}

const onNo = (value: ShowExitPrompt): void => {
  value.prompt.next(ExitPromptAnswers.Cancel)
  value.prompt.complete()
}

const RootStack = createStackNavigator<RootScreenStackParamList>()

const WalletScreenStackWithContext = () => {
  const { onExit } = useApplicationContext().appHook
  const { inBackground } = useBgDetect()
  const isLocked = useSelector(selectIsLocked)

  const doExit = () => {
    onExit().subscribe({
      next: (value: ExitEvents) => {
        if (value instanceof ShowExitPrompt) {
          Alert.alert(
            'Exit app?',
            'Your passphrase will remain securely stored for easier later access of wallet.',
            [
              {
                text: 'Ok',
                onPress: () => onOk(value as ShowExitPrompt)
              },
              {
                text: 'Cancel',
                onPress: () => onNo(value as ShowExitPrompt),
                style: 'cancel'
              }
            ]
          )
        }
      },
      error: err => Alert.alert(err.message)
    })
  }

  return (
    <>
      <WalletScreenStack onExit={doExit} />
      {isLocked && <PinScreen />}

      {/* This protects from leaking last screen in "recent apps" list.                                 */}
      {/* For Android it is additionally implemented natively in MainActivity.java because react-native */}
      {/* isn't fast enough to change layout before system makes screenshot of app for recent apps list */}
      {inBackground && <PrivacyScreen />}
    </>
  )
}

const RootScreenStack = () => {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false
      }}>
      <RootStack.Screen
        name={AppNavigation.Root.NoWallet}
        component={NoWalletScreenStack}
        options={{
          animationEnabled: false
        }}
      />
      <RootStack.Screen
        name={AppNavigation.Root.Onboard}
        component={OnboardScreenStack}
        options={{
          animationEnabled: false
        }}
      />
      <RootStack.Screen
        name={AppNavigation.Root.Wallet}
        component={WalletScreenStackWithContext}
        options={{
          animationEnabled: false,
          presentation: 'card'
        }}
      />
    </RootStack.Navigator>
  )
}

export default RootScreenStack

function PinScreen() {
  const dispatch = useDispatch()
  const { appNavHook } = useApplicationContext()

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute'
      }}>
      <PinOrBiometryLogin
        onSignInWithRecoveryPhrase={() => appNavHook.resetNavToEnterMnemonic()}
        onLoginSuccess={() => {
          dispatch(onAppUnlocked())
        }}
      />
    </View>
  )
}

function PrivacyScreen() {
  const { theme } = useApplicationContext()
  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colorBg1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute'
      }}>
      <OwlSVG />
    </View>
  )
}
