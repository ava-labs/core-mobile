/**
 * Core X
 *
 * @format
 * @flow strict-local
 */

import React, { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  LogBox,
  Platform,
  SafeAreaView
} from 'react-native'
import WalletScreenStack from 'navigation/WalletScreenStack'
import { NavigationContainer } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AppNavigation from 'navigation/AppNavigation'
import { ExitEvents, ExitPromptAnswers, ShowExitPrompt } from 'AppHook'
import { OnboardScreenStack } from 'navigation/OnboardScreenStack'
import { createStackNavigator } from '@react-navigation/stack'
import useDevDebugging from 'utils/debugging/DevDebugging'
import { useLoadBridgeConfig } from 'screens/bridge/hooks/useLoadBridgeConfig'

const RootStack = createStackNavigator()

LogBox.ignoreAllLogs()

const onOk = (value: ShowExitPrompt): void => {
  value.prompt.next(ExitPromptAnswers.Ok)
  value.prompt.complete()
}

const onNo = (value: ShowExitPrompt): void => {
  value.prompt.next(ExitPromptAnswers.Cancel)
  value.prompt.complete()
}

const WalletScreenStackWithContext = () => {
  const { onExit } = useApplicationContext().appHook

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

  return <WalletScreenStack onExit={doExit} />
}

const RootScreenStack = () => {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false
      }}>
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

export default function App() {
  const { configure } = useDevDebugging()
  const isProduction = process.env.NODE_ENV === 'production'
  useLoadBridgeConfig()
  if (!isProduction) {
    configure()
  }
  const context = useApplicationContext()
  const [backgroundStyle] = useState(context.appBackgroundStyle)

  return (
    <SafeAreaView style={backgroundStyle}>
      <KeyboardAvoidingView
        enabled={context.keyboardAvoidingViewEnabled}
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <NavigationContainer
          theme={context.navContainerTheme}
          ref={context.appNavHook.navigation}>
          <RootScreenStack />
        </NavigationContainer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
