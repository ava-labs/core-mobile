/**
 * Context wrapper for App
 **/
import React, { FC, PropsWithChildren, useEffect, useState } from 'react'
import * as Sentry from '@sentry/react-native'
import Toast from 'react-native-toast-notifications'
import JailMonkey from 'jail-monkey'
import { RootSiblingParent } from 'react-native-root-siblings'
import JailbrokenWarning from 'screens/onboarding/JailbrokenWarning'
import { PosthogContextProvider } from 'contexts/PosthogContext'
import { StatusBar } from 'react-native'
import { EncryptedStoreProvider } from 'contexts/EncryptedStoreProvider'
import { TopLevelErrorFallback } from 'components/TopLevelErrorFallback'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import SentryService from 'services/sentry/SentryService'
import { App } from './App'

function setToast(toast: Toast): void {
  global.toast = toast
}

/**
 * Aggregate all the top-level context providers for better readability.
 */
// TODO: add DeeplinkContextProvider
const ContextProviders: FC<PropsWithChildren> = ({ children }) => (
  <EncryptedStoreProvider>
    <ReactQueryProvider>
      <PosthogContextProvider>{children}</PosthogContextProvider>
    </ReactQueryProvider>
  </EncryptedStoreProvider>
)

const ContextApp = (): JSX.Element => {
  // TODO: convert TopLevelErrorFallback to new design
  return (
    <Sentry.ErrorBoundary fallback={<TopLevelErrorFallback />}>
      <StatusBar barStyle={'light-content'} backgroundColor="black" />
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
    // TODO: convert JailbrokenWarning to new design
    return <JailbrokenWarning onOK={() => setShowJailBroken(false)} />
  }

  return <>{children}</>
}

export default SentryService.isAvailable ? Sentry.wrap(ContextApp) : ContextApp
