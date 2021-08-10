import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import React, {createContext, useState} from 'react';
import {COLORS, COLORS_NIGHT} from 'resources/Constants';
import {Appearance} from 'react-native';

interface ApplicationContextState {
  wallet?: MnemonicWallet;
  theme: typeof COLORS | typeof COLORS_NIGHT;
}

export const ApplicationContext = createContext<ApplicationContextState>({
  theme: COLORS,
  wallet: undefined,
});

export const ApplicationContextProvider = ({children}: {children: any}) => {
  const [wallet] = useState<MnemonicWallet>();
  const [theme] = useState(
    Appearance.getColorScheme() === 'dark' ? COLORS_NIGHT : COLORS,
  );

  const appContextState: ApplicationContextState = {
    wallet: wallet,
    theme: theme,
  };
  return (
    <ApplicationContext.Provider value={appContextState}>
      {children}
    </ApplicationContext.Provider>
  );
};
