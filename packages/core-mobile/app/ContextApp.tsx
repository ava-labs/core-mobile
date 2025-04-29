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
import { View } from 'react-native'
import { DeeplinkContextProvider } from 'contexts/DeeplinkContext/DeeplinkContext'
import { EncryptedStoreProvider } from 'contexts/EncryptedStoreProvider'
import { TopLevelErrorFallback } from 'components/TopLevelErrorFallback'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import SentryService from 'services/sentry/SentryService'
import CoreSplash from 'assets/icons/core_splash.svg'
import { useMigrateFromAsyncStorage } from 'hooks/useMigrateFromAsyncStorage'

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
      {hasMigrated ? (
        <ContextProviders>
          <JailBrokenCheck>
            <RootSiblingParent>
              <App />
            </RootSiblingParent>
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
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'black'
          }}>
          <CoreSplash width={300} height={300} />
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
