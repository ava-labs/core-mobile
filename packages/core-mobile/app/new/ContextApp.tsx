/**
 * Context wrapper for App
 **/
import * as Sentry from '@sentry/react-native'
import { EncryptedStoreProvider } from 'contexts/EncryptedStoreProvider'
import { PosthogContextProvider } from 'contexts/PosthogContext'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import React, { FC, PropsWithChildren } from 'react'
import { RootSiblingParent } from 'react-native-root-siblings'
import Toast from 'react-native-toast-notifications'
import SentryService from 'services/sentry/SentryService'
import { Confetti, ConfettiMethods } from '@avalabs/k2-alpine'
import { App } from './App'
import JailbreakCheck from './common/components/JailbreakCheck'
import TopLevelErrorFallback from './common/components/TopLevelErrorFallback'

const setGlobalToast = (toast: Toast): void => {
  global.toast = toast
}

const setGlobalConfetti = (confetti: ConfettiMethods): void => {
  global.confetti = confetti
}

/**
 * Aggregate all the top-level context providers for better readability.
 */
const ContextProviders: FC<PropsWithChildren> = ({ children }) => (
  <EncryptedStoreProvider>
    <ReactQueryProvider>
      <PosthogContextProvider>{children}</PosthogContextProvider>
    </ReactQueryProvider>
  </EncryptedStoreProvider>
)

const ContextApp = (): JSX.Element => {
  return (
    <Sentry.ErrorBoundary fallback={TopLevelErrorFallback}>
      <ContextProviders>
        <RootSiblingParent>
          <App />
        </RootSiblingParent>
        <JailbreakCheck />
        <Toast ref={setGlobalToast} offsetTop={30} normalColor={'00FFFFFF'} />
        <Confetti ref={setGlobalConfetti} />
      </ContextProviders>
    </Sentry.ErrorBoundary>
  )
}

export default SentryService.isAvailable ? Sentry.wrap(ContextApp) : ContextApp
