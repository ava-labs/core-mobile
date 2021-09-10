import React, {createContext, useState} from 'react';
import {COLORS_DAY, COLORS_NIGHT} from 'resources/Constants';
import {Appearance} from 'react-native';
import type {Theme} from '@react-navigation/native';

interface ApplicationContextState {
  theme: typeof COLORS_DAY | typeof COLORS_NIGHT;
  isDarkMode: boolean;
  backgroundStyle: BackgroundStyle;
  appBackgroundStyle: AppBackgroundStyle;
  navContainerTheme: Theme;
}

export declare type BackgroundStyle = {
  backgroundColor: string;
  flex: number;
  paddingBottom?: number;
  paddingStart?: number;
  paddingEnd?: number;
};

export declare type AppBackgroundStyle = {
  flex: number;
  backgroundColor: string;
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
  } as BackgroundStyle);

  const [appBackgroundStyle] = useState({
    backgroundColor: theme.bgApp,
    flex: 1,
  } as AppBackgroundStyle);

  const [navContainerTheme] = useState({
    dark: isDarkMode,
    colors: {
      primary: theme.accentColor,
      background: theme.bgApp,
      text: theme.txtOnBgApp,
      card: theme.bgOnBgApp,
      border: theme.bgApp,
      notification: theme.accentColor,
    },
  } as Theme);

  const appContextState: ApplicationContextState = {
    theme,
    isDarkMode,
    backgroundStyle,
    appBackgroundStyle,
    navContainerTheme,
  };
  return (
    <ApplicationContext.Provider value={appContextState}>
      {children}
    </ApplicationContext.Provider>
  );
};
