import React, { createContext, useContext, useState } from 'react'
import { COLORS_DAY, COLORS_NIGHT } from 'resources/Constants'
import type { Theme } from '@react-navigation/native'
import { AppHook, useApp } from 'AppHook'
import { Repo, useRepo } from 'Repo'
import { AppNavHook, useAppNav } from 'useAppNav'
import { useWalletSetup, WalletSetupHook } from 'hooks/useWalletSetup'

export type AppTheme = typeof COLORS_DAY | typeof COLORS_NIGHT

export interface ApplicationContextState {
  theme: AppTheme
  isDarkMode: boolean
  backgroundStyle: BackgroundStyle
  navContainerTheme: Theme
  shadow: Shadow
  keyboardAvoidingViewEnabled: boolean
  setKeyboardAvoidingViewEnabled: (value: boolean) => void
  appHook: AppHook
  repo: Repo
  appNavHook: AppNavHook
  walletSetupHook: WalletSetupHook
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

export const ApplicationContext = createContext<ApplicationContextState>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  {} as any
)

export const ApplicationContextProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const appNavHook = useAppNav()
  const repository = useRepo()
  const walletSetupHook = useWalletSetup(appNavHook)
  const appHook = useApp(appNavHook, walletSetupHook, repository)

  const isDarkMode = true // useState(Appearance.getColorScheme() === 'dark');
  const [theme] = useState(isDarkMode ? COLORS_NIGHT : COLORS_DAY)
  const [backgroundStyle] = useState({
    backgroundColor: theme.background,
    flex: 1,
    paddingBottom: 16,
    paddingStart: 16,
    paddingEnd: 16
  } as BackgroundStyle)

  const [navContainerTheme] = useState({
    dark: isDarkMode,
    colors: {
      primary: theme.colorText1,
      background: theme.background,
      text: theme.colorText1,
      card: theme.background,
      border: theme.background,
      notification: theme.colorPrimary1
    }
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

  const appContextState: ApplicationContextState = {
    theme,
    isDarkMode,
    backgroundStyle,
    navContainerTheme,
    shadow,
    keyboardAvoidingViewEnabled,
    setKeyboardAvoidingViewEnabled,
    appHook,
    repo: repository,
    appNavHook,
    walletSetupHook
  }
  return (
    <ApplicationContext.Provider value={appContextState}>
      {children}
    </ApplicationContext.Provider>
  )
}

export function useApplicationContext() {
  return useContext(ApplicationContext)
}
