/**
 * Context wrapper for App
 **/

import React, {useEffect, useState} from 'react';
import App from 'App';
import {ApplicationContextProvider} from 'contexts/ApplicationContext';
import Toast from 'react-native-toast-notifications';
import {
  AccountsContextProvider,
  NetworkContextProvider,
  WalletContextProvider,
} from '@avalabs/wallet-react-components';
import BiometricsSDK from 'utils/BiometricsSDK';
import Splash from 'screens/onboarding/Splash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SECURE_ACCESS_SET} from 'resources/Constants';
import {Platform} from 'react-native';
import JailMonkey from 'jail-monkey';
import JailbrokenWarning from 'screens/onboarding/JailbrokenWarning';

export default function ContextApp() {
  const [isWarmingUp, setIsWarmingUp] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [showJailBroken, setShowJailBroken] = useState(false);

  useEffect(() => {
    if (JailMonkey.isJailBroken()) {
      console.log('jailbroken');
      setShowJailBroken(true);
    }
    AsyncStorage.getItem(SECURE_ACCESS_SET).then(result => {
      if (result && Platform.OS === 'android') {
        setShowSplash(true);
        BiometricsSDK.warmup().then(() => {
          setTimeout(() => {
            setShowSplash(false);
            setIsWarmingUp(false);
          }, 1000);
        });
      } else {
        setIsWarmingUp(false);
      }
    });
  }, []);

  return (
    <ApplicationContextProvider>
      <NetworkContextProvider>
        <AccountsContextProvider>
          <WalletContextProvider>
            {!showSplash && showJailBroken && (
              <JailbrokenWarning onOK={() => setShowJailBroken(false)} />
            )}
            {showSplash && !showJailBroken && <Splash />}
            {!isWarmingUp && !showJailBroken && <App />}
          </WalletContextProvider>
        </AccountsContextProvider>
      </NetworkContextProvider>
      <Toast ref={ref => (global.toast = ref)} />
    </ApplicationContextProvider>
  );
}
