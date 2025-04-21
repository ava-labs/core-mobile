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
import { EncryptedStoreProvider } from 'contexts/EncryptedStoreProvider'
import { TopLevelErrorFallback } from 'components/TopLevelErrorFallback'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import { DeeplinkContextProvider } from 'contexts/DeeplinkContext/DeeplinkContext'
import SentryService from 'services/sentry/SentryService'
import { App } from './App'

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
        <DeeplinkContextProvider>{children}</DeeplinkContextProvider>
      </PosthogContextProvider>
    </ReactQueryProvider>
  </EncryptedStoreProvider>
)

const ContextApp = (): JSX.Element => {
  // TODO: convert TopLevelErrorFallback to new design
  return (
    <Sentry.ErrorBoundary fallback={<TopLevelErrorFallback />}>
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
