import React, {createContext, useContext, useState} from 'react';
import {COLORS_DAY, COLORS_NIGHT} from 'resources/Constants';
import type {Theme} from '@react-navigation/native';
import {Appearance} from 'react-native';
import {AppHook, useApp} from 'AppViewModel';
import {Repo, useRepo} from 'Repo';

export interface ApplicationContextState {
  theme: typeof COLORS_DAY | typeof COLORS_NIGHT;
  isDarkMode: boolean;
  backgroundStyle: BackgroundStyle;
  appBackgroundStyle: AppBackgroundStyle;
  navContainerTheme: Theme;
  shadow: Shadow;
  keyboardAvoidingViewEnabled: boolean;
  setKeyboardAvoidingViewEnabled: (value: boolean) => void;
  appHook: AppHook;
  repo: Repo;
}

export declare type BackgroundStyle = {
  backgroundColor: string;
  flex: number;
  paddingBottom?: number;
  paddingStart?: number;
  paddingEnd?: number;
};

export declare type Shadow = {
  shadowColor: string;
  shadowRadius: number;
  shadowOpacity: number;
  elevation: number;
  shadowOffset: {width: number; height: number};
};

export declare type AppBackgroundStyle = {
  flex: number;
  backgroundColor: string;
};

export const ApplicationContext = createContext<ApplicationContextState>(
  {} as any,
);

export const ApplicationContextProvider = ({children}: {children: any}) => {
  const appHook = useApp();
  const repository = useRepo();
  const [isDarkMode] = useState(Appearance.getColorScheme() === 'dark');
  const [theme] = useState(isDarkMode ? COLORS_NIGHT : COLORS_DAY);
  const [backgroundStyle] = useState({
    backgroundColor: theme.background,
    flex: 1,
    paddingBottom: 16,
    paddingStart: 16,
    paddingEnd: 16,
  } as BackgroundStyle);

  const [appBackgroundStyle] = useState({
    backgroundColor: theme.background,
    flex: 1,
  } as AppBackgroundStyle);

  const [navContainerTheme] = useState({
    dark: isDarkMode,
    colors: {
      primary: theme.colorText1,
      background: theme.background,
      text: theme.colorText1,
      card: theme.background,
      border: theme.background,
      notification: theme.accentColor,
    },
  } as Theme);

  const [shadow] = useState({
    shadowColor: theme.shadow,
    shadowRadius: 3,
    shadowOpacity: 0.5,
    elevation: 3,
    shadowOffset: {width: 0, height: 1},
  } as Shadow);

  const [keyboardAvoidingViewEnabled, setKeyboardAvoidingViewEnabled] =
    useState(true);

  const appContextState: ApplicationContextState = {
    theme,
    isDarkMode,
    backgroundStyle,
    appBackgroundStyle,
    navContainerTheme,
    shadow,
    keyboardAvoidingViewEnabled,
    setKeyboardAvoidingViewEnabled,
    appHook,
    repo: repository,
  };
  return (
    <ApplicationContext.Provider value={appContextState}>
      {children}
    </ApplicationContext.Provider>
  );
};

export function useApplicationContext() {
  return useContext(ApplicationContext);
}
