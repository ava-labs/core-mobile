/**
 * Context wrapper for App
 **/
import React, { FC, PropsWithChildren } from 'react'
import * as Sentry from '@sentry/react-native'
import Toast from 'react-native-toast-notifications'
import { RootSiblingParent } from 'react-native-root-siblings'
import { PosthogContextProvider } from 'contexts/PosthogContext'
import { EncryptedStoreProvider } from 'contexts/EncryptedStoreProvider'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import { DeeplinkContextProvider } from 'contexts/DeeplinkContext/DeeplinkContext'
import SentryService from 'services/sentry/SentryService'
import TopLevelErrorFallback from './common/components/TopLevelErrorFallback'
import { App } from './App'
import JailbreakCheck from './common/components/JailbreakCheck'

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
  return (
    <Sentry.ErrorBoundary fallback={<TopLevelErrorFallback />}>
      <ContextProviders>
        <RootSiblingParent>
          <App />
        </RootSiblingParent>
        <JailbreakCheck />
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

export default SentryService.isAvailable ? Sentry.wrap(ContextApp) : ContextApp
