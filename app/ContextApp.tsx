/**
 * Context wrapper for App
 **/

import React, { useEffect, useState } from 'react'

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import App from 'App'
import { ApplicationContextProvider } from 'contexts/ApplicationContext'
import Toast from 'react-native-toast-notifications'
import JailMonkey from 'jail-monkey'
import JailbrokenWarning from 'screens/onboarding/JailbrokenWarning'
import { BridgeProvider } from 'contexts/BridgeContext'
import { PosthogContextProvider } from 'contexts/PosthogContext'
import { persistor, store } from 'store'
import { StatusBar } from 'react-native'
import { DappConnectionContextProvider } from 'contexts/DappConnectionContext'

function setToast(toast: Toast) {
  global.toast = toast
}
// TODO: move these context providers inside context app when theme refactor is done
// right now Splash and JailbrokenWarning depend on the theme object from ApplicationContextProvider
const ContextAppWithRedux = () => {
  return (
    <>
      <StatusBar barStyle={'light-content'} />
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <PosthogContextProvider>
            <ApplicationContextProvider>
              <DappConnectionContextProvider>
                <ContextApp />
                <Toast
                  ref={ref => {
                    ref && setToast(ref)
                  }}
                  offsetTop={60}
                  normalColor={'00FFFFFF'}
                />
              </DappConnectionContextProvider>
            </ApplicationContextProvider>
          </PosthogContextProvider>
        </PersistGate>
      </Provider>
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

  return (
    <BridgeProvider>
      <App />
    </BridgeProvider>
  )
}

export default ContextAppWithRedux
