/**
 * Context wrapper for App
 **/

import React from 'react';
import App from 'App';
import {ApplicationContextProvider} from 'contexts/ApplicationContext';
import {
  NetworkContextProvider,
  WalletContextProvider,
} from '@avalabs/wallet-react-components';

export default function ContextApp() {
  return (
    <ApplicationContextProvider>
      <NetworkContextProvider>
        <WalletContextProvider>
          <App />
        </WalletContextProvider>
      </NetworkContextProvider>
    </ApplicationContextProvider>
  );
}
