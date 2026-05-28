/**
 * Context wrapper for App
 **/
import * as Sentry from '@sentry/react-native'
import { Confetti } from 'common/components/Confetti'
import { EncryptedStoreProvider } from 'contexts/EncryptedStoreProvider'
import { PosthogContextProvider } from 'contexts/PosthogContext'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import React, { FC, PropsWithChildren } from 'react'
import { ConfettiMethods } from 'react-native-fast-confetti'
import { RootSiblingParent } from 'react-native-root-siblings'
import SentryService from 'services/sentry/SentryService'
import { SentryTag } from 'services/sentry/types'
import { SchemaMigrationError } from 'store/schemaMigration/schemaMigrationFailureStore'
import { App } from './App'
import JailbreakCheck from './common/components/JailbreakCheck'
import TopLevelErrorFallback from './common/components/TopLevelErrorFallback'

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

const beforeCapture = (scope: Sentry.Scope, error: unknown): void => {
  /**
   * Tag schema-migration throws with the right Sentry metadata so the
   * single boundary capture carries `system` + `version` context. Owning
   * this here (rather than calling `captureException` from the migrate
   * wrap) keeps reporting on a single path and avoids duplicate events.
   */
  if (error instanceof SchemaMigrationError) {
    scope.setTag('system', SentryTag.SchemaMigration)
    scope.setContext('details', { version: error.version })
  }
}

const ContextApp = (): JSX.Element => {
  return (
    <Sentry.ErrorBoundary
      fallback={TopLevelErrorFallback}
      beforeCapture={beforeCapture}>
      <ContextProviders>
        <RootSiblingParent>
          <App />
        </RootSiblingParent>
        <JailbreakCheck />
        <Confetti ref={setGlobalConfetti} />
      </ContextProviders>
    </Sentry.ErrorBoundary>
  )
}

export default SentryService.isAvailable ? Sentry.wrap(ContextApp) : ContextApp
