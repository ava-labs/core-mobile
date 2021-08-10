import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import React, {createContext, useState} from 'react';
import {COLORS, COLORS_NIGHT} from 'resources/Constants';
import {Appearance} from 'react-native';

interface ApplicationContextState {
  wallet?: MnemonicWallet;
  theme: typeof COLORS | typeof COLORS_NIGHT;
  isDarkMode: boolean;
  backgroundStyle: BackgroundStyle;
  appBackgroundStyle: BackgroundStyle;
}

export declare type BackgroundStyle = {
  backgroundColor: COLORS | COLORS_NIGHT;
  flex: number;
  paddingBottom?: number;
  paddingStart?: number;
  paddingEnd?: number;
};

export const ApplicationContext = createContext<ApplicationContextState>({
  theme: COLORS,
  wallet: undefined,
  isDarkMode: false,
  backgroundStyle: {
    backgroundColor: COLORS.bg,
    flex: 1,
    paddingBottom: 16,
    paddingStart: 16,
    paddingEnd: 16,
  },
  appBackgroundStyle: {
    backgroundColor: COLORS.bg,
    flex: 1,
  },
});

export const ApplicationContextProvider = ({children}: {children: any}) => {
  const [wallet] = useState<MnemonicWallet>();
  const [isDarkMode] = useState(Appearance.getColorScheme() === 'dark');
  const [theme] = useState(isDarkMode ? COLORS_NIGHT : COLORS);
  const [backgroundStyle] = useState({
    backgroundColor: theme.bg,
    flex: 1,
    paddingBottom: 16,
    paddingStart: 16,
    paddingEnd: 16,
  });
  const [appBackgroundStyle] = useState({
    backgroundColor: theme.bg,
    flex: 1,
  });

  const appContextState: ApplicationContextState = {
    wallet: wallet,
    theme: theme,
    isDarkMode,
    backgroundStyle,
    appBackgroundStyle,
  };
  return (
    <ApplicationContext.Provider value={appContextState}>
      {children}
    </ApplicationContext.Provider>
  );
};
