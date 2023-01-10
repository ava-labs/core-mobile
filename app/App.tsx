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
import RootScreenStack from 'navigation/RootScreenStack'
import { NavigationContainer } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import useDevDebugging from 'utils/debugging/DevDebugging'
import 'utils/debugging/wdyr'
import Config from 'react-native-config'
import * as Sentry from '@sentry/react-native'
import { DefaultSampleRate } from 'services/sentry/SentryWrapper'

LogBox.ignoreLogs([
  'Require cycle:',
  "Can't perform",
  'new',
  'Non-serializable'
])

//init Sentry
if (Config.SENTRY_DSN && !__DEV__) {
  Sentry.init({
    dsn: Config.SENTRY_DSN,
    environment: Config.ENVIRONMENT,
    debug: false,
    beforeSend: event => {
      /**
       * eliminating breadcrumbs. This should eliminate
       * a massive amount of the data leaks into sentry. If we find that console
       * is leaking data, suspected that it might, than we can review the leak and
       * see if we can modify the data before it is recorded. This can be
       * done in the sentry options beforeBreadcrumbs function.
       */
      delete event?.user?.email
      delete event?.user?.ip_address
      delete event.contexts?.device?.name

      return event
    },
    beforeBreadcrumb: () => {
      return null
    },
    tracesSampler: samplingContext => {
      return samplingContext.sampleRate ?? DefaultSampleRate
    },
    integrations: []
  })
}

export default function App() {
  const { configure } = useDevDebugging()
  const isProduction = process.env.NODE_ENV === 'production'
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
