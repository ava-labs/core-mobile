/**
 * Context wrapper for App
 **/

import React, { FC, useEffect, useState } from 'react'
import * as Sentry from '@sentry/react-native'
import App from 'App'
import { ApplicationContextProvider } from 'contexts/ApplicationContext'
import Toast from 'react-native-toast-notifications'
import JailMonkey from 'jail-monkey'
import JailbrokenWarning from 'screens/onboarding/JailbrokenWarning'
import { BridgeProvider } from 'contexts/BridgeContext'
import { PosthogContextProvider } from 'contexts/PosthogContext'
import { StatusBar } from 'react-native'
import { DappConnectionContextProvider } from 'contexts/DappConnectionContext'
import { EncryptedStoreProvider } from 'contexts/EncryptedStoreProvider'

function setToast(toast: Toast) {
  global.toast = toast
}

/**
 * Aggregate all the top-level context providers for better readability.
 */
const ContextProviders: FC = ({ children }) => (
  <EncryptedStoreProvider>
    <PosthogContextProvider>
      <ApplicationContextProvider>
        <DappConnectionContextProvider>
          <BridgeProvider>{children}</BridgeProvider>
        </DappConnectionContextProvider>
      </ApplicationContextProvider>
    </PosthogContextProvider>
  </EncryptedStoreProvider>
)

// TODO: move these context providers inside context app when theme refactor is done
// right now Splash and JailbrokenWarning depend on the theme object from ApplicationContextProvider
const ContextAppWithRedux = () => {
  return (
    <>
      <StatusBar barStyle={'light-content'} />
      <ContextProviders>
        <ContextApp />
        <Toast
          ref={ref => {
            ref && setToast(ref)
          }}
          offsetTop={60}
          normalColor={'00FFFFFF'}
        />
      </ContextProviders>
    </>
  )
}

const ContextApp = () => {
  const [showJailBroken, setShowJailBroken] = useState(false)

  useEffect(() => {
    if (!__DEV__ && JailMonkey.isJailBroken()) {
      setShowJailBroken(true)
    }
  }, [])

  if (showJailBroken) {
    return <JailbrokenWarning onOK={() => setShowJailBroken(false)} />
  }

  return <App />
}

export default Sentry.wrap(ContextAppWithRedux)
