/**
 * Context wrapper for App
 **/

import React, {useEffect, useState} from 'react';
import App from 'App';
import {ApplicationContextProvider} from 'contexts/ApplicationContext';
import {
  NetworkContextProvider,
  WalletContextProvider,
} from '@avalabs/wallet-react-components';
import BiometricsSDK from 'utils/BiometricsSDK';
import Splash from 'screens/onboarding/Splash';

export default function ContextApp() {
  const [isWarmingUp, setIsWarmingUp] = useState(true);

  useEffect(() => {
    BiometricsSDK.warmup().then(() => {
      setTimeout(() => {
        setIsWarmingUp(false);
      }, 1000);
    });
  }, []);

  return (
    <ApplicationContextProvider>
      <NetworkContextProvider>
        <WalletContextProvider>
          {isWarmingUp && <Splash />}
          {!isWarmingUp && <App />}
        </WalletContextProvider>
      </NetworkContextProvider>
    </ApplicationContextProvider>
  );
}
