/**
 * Context wrapper for App
 **/
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView
} from 'react-native-gesture-handler'
import * as Sentry from '@sentry/react-native'
import { Alert, View } from 'react-native'
import Share from 'react-native-share'
import { DeeplinkContextProvider } from 'contexts/DeeplinkContext/DeeplinkContext'
import { EncryptedStoreProvider } from 'contexts/EncryptedStoreProvider'
import { PosthogContextProvider } from 'contexts/PosthogContext'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import React, { FC, PropsWithChildren } from 'react'
import { RootSiblingParent } from 'react-native-root-siblings'
import Toast from 'react-native-toast-notifications'
import SentryService from 'services/sentry/SentryService'
import { Confetti, ConfettiMethods } from '@avalabs/k2-alpine'
import { startProfiling, stopProfiling } from 'react-native-release-profiler'
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
      <PosthogContextProvider>
        <DeeplinkContextProvider>{children}</DeeplinkContextProvider>
      </PosthogContextProvider>
    </ReactQueryProvider>
  </EncryptedStoreProvider>
)

const twoFingerTap = Gesture.Tap()
  .minPointers(2)
  .onEnd(() => {
    Alert.alert('Toggle Profiling?', '', [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Off',
        onPress: async () => {
          const path = await stopProfiling(true)
          const actualPath = `file://${path}`

          Share.open({
            url: actualPath,
            title: 'Share profile.cpuprofile'
          })
        }
      },
      { text: 'On', onPress: () => startProfiling() }
    ])
  })
  .runOnJS(true)

const ContextApp = (): JSX.Element => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={twoFingerTap}>
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          <Sentry.ErrorBoundary fallback={TopLevelErrorFallback}>
            <ContextProviders>
              <RootSiblingParent>
                <App />
              </RootSiblingParent>
              <JailbreakCheck />
              <Toast
                ref={setGlobalToast}
                offsetTop={30}
                normalColor={'00FFFFFF'}
              />
              <Confetti ref={setGlobalConfetti} />
            </ContextProviders>
          </Sentry.ErrorBoundary>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

export default SentryService.isAvailable ? Sentry.wrap(ContextApp) : ContextApp
