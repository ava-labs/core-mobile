import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  LogBox,
  Platform,
  UIManager,
  View
} from 'react-native'
import * as Sentry from '@sentry/react-native'
import RootScreenStack from 'navigation/RootScreenStack'
import { NavigationContainer } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import useDevDebugging from 'utils/debugging/DevDebugging'
import 'utils/debugging/wdyr'
import { navigationRef } from 'utils/Navigation'
import SentryService from 'services/sentry/SentryService'
import DataDogService from 'services/datadog/DataDogService'
import Logger, { LogLevel } from 'utils/Logger'
import { SafeAreaProvider } from 'react-native-safe-area-context'

Logger.setLevel(__DEV__ ? LogLevel.TRACE : LogLevel.ERROR)

LogBox.ignoreLogs([
  'Require cycle:',
  "Can't perform",
  'new',
  'Non-serializable'
])

SentryService.init()

Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(false)

function App(): JSX.Element {
  const { configure } = useDevDebugging()
  const isProduction = process.env.NODE_ENV === 'production'
  if (!isProduction) {
    configure()
  }

  const context = useApplicationContext()
  const [backgroundStyle] = useState(context.appBackgroundStyle)

  return (
    <View style={backgroundStyle}>
      <SafeAreaProvider>
        <KeyboardAvoidingView
          enabled={context.keyboardAvoidingViewEnabled}
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <NavigationContainer
            theme={context.navContainerTheme}
            ref={navigationRef}
            onReady={() => {
              SentryService.routingInstrumentation.registerNavigationContainer(
                navigationRef
              )
              DataDogService.init(navigationRef).catch(Logger.error)
            }}>
            <RootScreenStack />
          </NavigationContainer>
        </KeyboardAvoidingView>
      </SafeAreaProvider>
    </View>
  )
}

export default Sentry.wrap(App)
