/**
 * Context wrapper for App
 **/

import React, { useEffect, useState } from 'react'
import App from 'App'
import { ApplicationContextProvider } from 'contexts/ApplicationContext'
import Toast from 'react-native-toast-notifications'
import {
  AccountsContextProvider,
  NetworkContextProvider,
  WalletContextProvider,
  WalletStateContextProvider
} from '@avalabs/wallet-react-components'
import BiometricsSDK from 'utils/BiometricsSDK'
import Splash from 'screens/onboarding/Splash'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SECURE_ACCESS_SET } from 'resources/Constants'
import { Platform } from 'react-native'
import JailMonkey from 'jail-monkey'
import JailbrokenWarning from 'screens/onboarding/JailbrokenWarning'
import { BridgeProvider } from 'contexts/BridgeContext'

export default function ContextApp() {
  const [isWarmingUp, setIsWarmingUp] = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const [showJailBroken, setShowJailBroken] = useState(false)

  useEffect(() => {
    if (JailMonkey.isJailBroken()) {
      setShowSplash(false)
      setShowJailBroken(true)
    } else {
      setTimeout(() => {
        setShowSplash(false)
        setIsWarmingUp(false)
      }, 4500)
    }
    AsyncStorage.getItem(SECURE_ACCESS_SET).then(result => {
      if (result && Platform.OS === 'android') {
        BiometricsSDK.warmup().then()
      } else {
        setIsWarmingUp(false)
      }
    })
  }, [])

  return (
    <>
      <NetworkContextProvider>
        <AccountsContextProvider>
          <WalletContextProvider>
            <WalletStateContextProvider>
              <ApplicationContextProvider>
                <BridgeProvider>
                  {!showSplash && showJailBroken && (
                    <JailbrokenWarning onOK={() => setShowJailBroken(false)} />
                  )}
                  {showSplash && !showJailBroken && <Splash />}
                  {!isWarmingUp && !showJailBroken && <App />}
                </BridgeProvider>
              </ApplicationContextProvider>
            </WalletStateContextProvider>
          </WalletContextProvider>
        </AccountsContextProvider>
      </NetworkContextProvider>
      <Toast ref={ref => (global.toast = ref)} />
    </>
  )
}
