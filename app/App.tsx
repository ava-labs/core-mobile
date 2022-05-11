/**
 * Core X
 *
 * @format
 * @flow strict-local
 */

import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  LogBox,
  Platform,
  SafeAreaView
} from 'react-native'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import RootScreenStack from 'navigation/RootScreenStack'
import { NavigationContainer } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import useDevDebugging from 'utils/debugging/DevDebugging'
import { store, persistor } from 'store'

LogBox.ignoreAllLogs()

export default function App() {
  const { configure } = useDevDebugging()
  const isProduction = process.env.NODE_ENV === 'production'
  if (!isProduction) {
    configure()
  }
  const context = useApplicationContext()
  const [backgroundStyle] = useState(context.appBackgroundStyle)

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
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
      </PersistGate>
    </Provider>
  )
}
