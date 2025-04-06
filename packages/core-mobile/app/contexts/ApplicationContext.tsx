import React, { createContext, useContext, useMemo, useState } from 'react'
import { COLORS_DAY, COLORS_NIGHT } from 'resources/Constants'
import { DefaultTheme, type Theme } from '@react-navigation/native'
import { AppHook, useApp } from 'AppHook'

export type AppTheme = typeof COLORS_DAY | typeof COLORS_NIGHT

export interface ApplicationContextState {
  theme: AppTheme
  isDarkMode: boolean
  backgroundStyle: BackgroundStyle
  appBackgroundStyle: AppBackgroundStyle
  navContainerTheme: Theme
  shadow: Shadow
  keyboardAvoidingViewEnabled: boolean
  setKeyboardAvoidingViewEnabled: (value: boolean) => void
  appHook: AppHook
}

export declare type BackgroundStyle = {
  backgroundColor: string
  flex: number
  paddingBottom?: number
  paddingStart?: number
  paddingEnd?: number
}

export declare type Shadow = {
  shadowColor: string
  shadowRadius: number
  shadowOpacity: number
  elevation: number
  shadowOffset: { width: number; height: number }
}

export declare type AppBackgroundStyle = {
  flex: number
  backgroundColor: string
}

export const ApplicationContext = createContext<ApplicationContextState>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  {} as any
)

export const ApplicationContextProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const appHook = useApp()

  const isDarkMode = true // useState(Appearance.getColorScheme() === 'dark');
  const [theme] = useState(isDarkMode ? COLORS_NIGHT : COLORS_DAY)
  const [backgroundStyle] = useState({
    backgroundColor: theme.background,
    flex: 1,
    paddingBottom: 16,
    paddingStart: 16,
    paddingEnd: 16
  } as BackgroundStyle)

  const [appBackgroundStyle] = useState({
    backgroundColor: theme.background,
    flex: 1
  } as AppBackgroundStyle)

  const [navContainerTheme] = useState({
    dark: isDarkMode,
    colors: {
      primary: theme.colorText1,
      background: theme.background,
      text: theme.colorText1,
      card: theme.background,
      border: theme.background,
      notification: theme.colorPrimary1
    },
    fonts: DefaultTheme.fonts
  } as Theme)

  const [shadow] = useState({
    shadowColor: theme.overlay,
    shadowRadius: 3,
    shadowOpacity: 0.5,
    elevation: 3,
    shadowOffset: { width: 0, height: 1 }
  } as Shadow)

  const [keyboardAvoidingViewEnabled, setKeyboardAvoidingViewEnabled] =
    useState(true)

  const appContextState: ApplicationContextState = useMemo(() => {
    return {
      theme,
      isDarkMode,
      backgroundStyle,
      appBackgroundStyle,
      navContainerTheme,
      shadow,
      keyboardAvoidingViewEnabled,
      setKeyboardAvoidingViewEnabled,
      appHook
    }
  }, [
    appHook,
    appBackgroundStyle,
    backgroundStyle,
    isDarkMode,
    keyboardAvoidingViewEnabled,
    navContainerTheme,
    shadow,
    theme
  ])

  return (
    <ApplicationContext.Provider value={appContextState}>
      {children}
    </ApplicationContext.Provider>
  )
}

export function useApplicationContext(): ApplicationContextState {
  return useContext(ApplicationContext)
}
