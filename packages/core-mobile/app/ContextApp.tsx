/**
 * Context wrapper for App
 **/

import React, { FC, useEffect, useState } from 'react'
import * as Sentry from '@sentry/react-native'
import App from 'App'
import { ApplicationContextProvider } from 'contexts/ApplicationContext'
import Toast from 'react-native-toast-notifications'
import JailMonkey from 'jail-monkey'
import { K2ThemeProvider } from '@avalabs/k2-mobile'
import JailbrokenWarning from 'screens/onboarding/JailbrokenWarning'
import { BridgeProvider } from 'contexts/BridgeContext'
import { PosthogContextProvider } from 'contexts/PosthogContext'
import { StatusBar } from 'react-native'
import { DeeplinkContextProvider } from 'contexts/DeeplinkContext/DeeplinkContext'
import { EncryptedStoreProvider } from 'contexts/EncryptedStoreProvider'
import { TopLevelErrorFallback } from 'components/TopLevelErrorFallback'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import FlipperAsyncStorage from 'rn-flipper-async-storage-advanced'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import SentryService from 'services/sentry/SentryService'

function setToast(toast: Toast): void {
  global.toast = toast
}

/**
 * Aggregate all the top-level context providers for better readability.
 */
const ContextProviders: FC = ({ children }) => (
  <EncryptedStoreProvider>
    <ReactQueryProvider>
      <PosthogContextProvider>
        <K2ThemeProvider>
          <ApplicationContextProvider>
            <DeeplinkContextProvider>
              <BridgeProvider>{children}</BridgeProvider>
            </DeeplinkContextProvider>
          </ApplicationContextProvider>
        </K2ThemeProvider>
      </PosthogContextProvider>
    </ReactQueryProvider>
  </EncryptedStoreProvider>
)

const ContextApp = (): JSX.Element => {
  return (
    <Sentry.ErrorBoundary fallback={<TopLevelErrorFallback />}>
      <StatusBar barStyle={'light-content'} backgroundColor="black" />
      {__DEV__ && <FlipperAsyncStorage />}
      <ContextProviders>
        <JailBrokenCheck>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <App />
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
    </Sentry.ErrorBoundary>
  )
}

const JailBrokenCheck: FC = ({ children }) => {
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
