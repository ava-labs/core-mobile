/**
 * Context wrapper for App
 **/

import React, { FC, PropsWithChildren, useEffect, useState } from 'react'
import * as Sentry from '@sentry/react-native'
import App from 'App'
import { ApplicationContextProvider } from 'contexts/ApplicationContext'
import Toast from 'react-native-toast-notifications'
import JailMonkey from 'jail-monkey'
import { RootSiblingParent } from 'react-native-root-siblings'
import { K2ThemeProvider } from '@avalabs/k2-mobile'
import JailbrokenWarning from 'screens/onboarding/JailbrokenWarning'
import { PosthogContextProvider } from 'contexts/PosthogContext'
import { StatusBar, View } from 'react-native'
import { DeeplinkContextProvider } from 'contexts/DeeplinkContext/DeeplinkContext'
import { EncryptedStoreProvider } from 'contexts/EncryptedStoreProvider'
import { TopLevelErrorFallback } from 'components/TopLevelErrorFallback'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import SentryService from 'services/sentry/SentryService'
import CoreSplash from 'assets/icons/core_splash.svg'
import { useMigrateFromAsyncStorage } from 'hooks/useMigrateFromAsyncStorage'
import NotificationsService from 'services/notifications/NotificationsService'

setTimeout(() => {
  NotificationsService.displayNotification({
    title: '3️⃣ Things to know this week:',
    body: '1) IRS offers temporary crypto tax relief\n2) XRP targets $2.90 after resistance break\n3) Bitcoin debates quantum computing risks'
  })
}, 10000)
function setToast(toast: Toast): void {
  global.toast = toast
}

/**
 * Aggregate all the top-level context providers for better readability.
 */
const ContextProviders: FC<PropsWithChildren> = ({ children }) => (
  <EncryptedStoreProvider>
    <ReactQueryProvider>
      <PosthogContextProvider>
        <K2ThemeProvider>
          <ApplicationContextProvider>
            <DeeplinkContextProvider>{children}</DeeplinkContextProvider>
          </ApplicationContextProvider>
        </K2ThemeProvider>
      </PosthogContextProvider>
    </ReactQueryProvider>
  </EncryptedStoreProvider>
)

const ContextApp = (): JSX.Element => {
  const hasMigrated = useMigrateFromAsyncStorage()

  return (
    <Sentry.ErrorBoundary fallback={<TopLevelErrorFallback />}>
      <StatusBar barStyle={'light-content'} backgroundColor="black" />
      {hasMigrated ? (
        <ContextProviders>
          <JailBrokenCheck>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootSiblingParent>
                <App />
              </RootSiblingParent>
            </GestureHandlerRootView>
          </JailBrokenCheck>
          <Toast
            ref={ref => {
              ref && setToast(ref)
            }}
            offsetTop={30}
            normalColor={'00FFFFFF'}
          />
        </ContextProviders>
      ) : (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <CoreSplash />
        </View>
      )}
    </Sentry.ErrorBoundary>
  )
}

const JailBrokenCheck: FC<PropsWithChildren> = ({ children }) => {
  const [showJailBroken, setShowJailBroken] = useState(false)

  useEffect(() => {
    if (!__DEV__ && JailMonkey.isJailBroken()) {
      setShowJailBroken(true)
    }
  }, [])

  if (showJailBroken) {
    return <JailbrokenWarning onOK={() => setShowJailBroken(false)} />
  }

  return <>{children}</>
}

export default SentryService.isAvailable ? Sentry.wrap(ContextApp) : ContextApp
