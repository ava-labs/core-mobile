import { AppStateStatus } from 'react-native'

export type AppState = {
  // this flag is used to show a splash screen
  // while the app is running some initial operations (fetching networks, warming up BiometricsSDK,...)
  isReady: boolean

  // indicates whether app is locked
  // if so, users will have to enter pin or use biometrics to unlock the app
  isLocked: boolean

  // indicates whether app is in background, foreground,...
  appState: AppStateStatus
}
