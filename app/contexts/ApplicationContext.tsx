import React, {createContext, useState} from 'react';
import {COLORS_DAY, COLORS_NIGHT} from 'resources/Constants';
import {Appearance} from 'react-native';

interface ApplicationContextState {
  theme: typeof COLORS_DAY | typeof COLORS_NIGHT;
  isDarkMode: boolean;
  backgroundStyle: BackgroundStyle;
  appBackgroundStyle: BackgroundStyle;
}

export declare type BackgroundStyle = {
  backgroundColor: COLORS_DAY | COLORS_NIGHT;
  flex: number;
  paddingBottom?: number;
  paddingStart?: number;
  paddingEnd?: number;
};

export const ApplicationContext = createContext<ApplicationContextState>(
  {} as any,
);

export const ApplicationContextProvider = ({children}: {children: any}) => {
  const [isDarkMode] = useState(Appearance.getColorScheme() === 'dark');
  const [theme] = useState(isDarkMode ? COLORS_NIGHT : COLORS_DAY);
  const [backgroundStyle] = useState({
    backgroundColor: theme.bgApp,
    flex: 1,
    paddingBottom: 16,
    paddingStart: 16,
    paddingEnd: 16,
  });
  const [appBackgroundStyle] = useState({
    backgroundColor: theme.bgApp,
    flex: 1,
  });

  const appContextState: ApplicationContextState = {
    theme,
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
