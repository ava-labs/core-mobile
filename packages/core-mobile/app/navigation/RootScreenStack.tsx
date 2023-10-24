import React, { useEffect } from 'react'
import {
  OnboardingScreenStackParamList,
  OnboardScreenStack
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
import { ExitEvents, ExitPromptAnswers, ShowExitPrompt } from 'AppHook'
import {
  NoWalletScreenStack,
  NoWalletScreenStackParams
} from 'navigation/NoWalletScreenStack'
import { useSelector } from 'react-redux'
import { selectIsLocked } from 'store/app'
import { useBgDetect } from 'navigation/useBgDetect'
import { RootStackScreenProps } from 'navigation/types'
import WarningModal from 'components/WarningModal'
import { PrivacyScreen } from './wallet/PrivacyScreen'
import { PinScreen } from './wallet/PinScreen'

export type RootScreenStackParamList = {
  [AppNavigation.Root
    .Onboard]: NavigatorScreenParams<OnboardingScreenStackParamList>
  [AppNavigation.Root.Wallet]: NavigatorScreenParams<WalletScreenStackParams>
  [AppNavigation.Root
    .NoWallet]: NavigatorScreenParams<NoWalletScreenStackParams>
  [AppNavigation.Root.CopyPhraseWarning]: {
    copy: () => void
  }
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
      <RootStack.Screen
        options={{ presentation: 'transparentModal' }}
        name={AppNavigation.Root.CopyPhraseWarning}
        component={CopyPhraseWarningModal}
      />
    </RootStack.Navigator>
  )
}

type CopyPhraseWarningNavigationProp = RootStackScreenProps<
  typeof AppNavigation.Root.CopyPhraseWarning
>

const CopyPhraseWarningModal = () => {
  const { goBack } =
    useNavigation<CopyPhraseWarningNavigationProp['navigation']>()
  const { params } = useRoute<CopyPhraseWarningNavigationProp['route']>()

  useEffect(() => {
    Vibration.vibrate()
  }, [])

  const onCopy = () => {
    goBack()
    params.copy()
  }

  const onCancel = () => {
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
