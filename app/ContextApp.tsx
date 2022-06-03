/**
 * Context wrapper for App
 **/

import React, { useEffect, useState } from 'react'

import { Provider, useSelector } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import App from 'App'
import { ApplicationContextProvider } from 'contexts/ApplicationContext'
import Toast from 'react-native-toast-notifications'
import {
  AccountsContextProvider,
  WalletContextProvider,
  WalletStateContextProvider
} from '@avalabs/wallet-react-components'
import Splash from 'screens/onboarding/Splash'
import JailMonkey from 'jail-monkey'
import JailbrokenWarning from 'screens/onboarding/JailbrokenWarning'
import { BridgeProvider } from 'contexts/BridgeContext'
import { PosthogContextProvider } from 'contexts/PosthogContext'
import { store, persistor } from 'store'
import { selectIsReady } from 'store/app'
import useDevDebugging from 'utils/debugging/DevDebugging'

// TODO: move these context providers inside context app when theme refactor is done
// right now Splash and JailbrokenWarning depend on the theme object from ApplicationContextProvider
const ContextAppWithRedux = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <PosthogContextProvider>
          <AccountsContextProvider>
            <WalletContextProvider>
              <WalletStateContextProvider>
                <ApplicationContextProvider>
                  <ContextApp />
                </ApplicationContextProvider>
              </WalletStateContextProvider>
            </WalletContextProvider>
          </AccountsContextProvider>
        </PosthogContextProvider>
        <Toast ref={ref => (global.toast = ref)} />
      </PersistGate>
    </Provider>
  )
}

const ContextApp = () => {
  const appIsReady = useSelector(selectIsReady)
  const [showJailBroken, setShowJailBroken] = useState(false)
  const { isSplashEnabled } = useDevDebugging()

  useEffect(() => {
    if (JailMonkey.isJailBroken()) {
      setShowJailBroken(true)
    }
  }, [])

  if (!appIsReady && isSplashEnabled) {
    return <Splash />
  }

  if (showJailBroken) {
    return <JailbrokenWarning onOK={() => setShowJailBroken(false)} />
  }

  return (
    <BridgeProvider>
      <App />
    </BridgeProvider>
  )
}

export default ContextAppWithRedux
