export * from './hooks'
export type { SxProp, Sx } from 'dripsy'
export * from './components'
export * from './theme/ThemeProvider'
export { Icons } from './theme/tokens/Icons'
export { Logos } from './theme/tokens/Logos'
export * from './utils'
export * from './const'
export type { TextVariant } from './theme/tokens/text'

import Constants from 'expo-constants'

// This means that the app is running storybook in expo-go
if (Constants.executionEnvironment === 'storeClient') {
  // When running in Storybook, register the root component
  // This should be done by package.json's react-native/main entry point,
  // but it's not working with expo sdk 52.
  // https://github.com/expo/expo/issues/32861
  // Dynamically load modules only if in Storybook mode
  const { registerRootComponent } = require('expo')
  const App = require('../App').default

  registerRootComponent(App)
}
