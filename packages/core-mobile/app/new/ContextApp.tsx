/**
 * Context wrapper for App
 **/
import { AlertWithTextInputs } from '@avalabs/k2-alpine'
import { AlertWithTextInputsHandle } from '@avalabs/k2-alpine/src/components/Alert/types'
import * as Sentry from '@sentry/react-native'
import { DeeplinkContextProvider } from 'contexts/DeeplinkContext/DeeplinkContext'
import { EncryptedStoreProvider } from 'contexts/EncryptedStoreProvider'
import { PosthogContextProvider } from 'contexts/PosthogContext'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import React, { FC, PropsWithChildren } from 'react'
import { RootSiblingParent } from 'react-native-root-siblings'
import Toast from 'react-native-toast-notifications'
import SentryService from 'services/sentry/SentryService'
import { App } from './App'
import JailbreakCheck from './common/components/JailbreakCheck'
import TopLevelErrorFallback from './common/components/TopLevelErrorFallback'

function setToast(toast: Toast): void {
  global.toast = toast
}

function setAlertWithTextInput(alert: AlertWithTextInputsHandle): void {
  global.alertWithTextInput = alert
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
        <AlertWithTextInputs
          ref={ref => {
            ref && setAlertWithTextInput(ref)
          }}
        />
      </ContextProviders>
    </Sentry.ErrorBoundary>
  )
}

export default SentryService.isAvailable ? Sentry.wrap(ContextApp) : ContextApp
