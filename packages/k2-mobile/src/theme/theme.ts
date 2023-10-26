import { makeTheme } from 'dripsy'

export const theme = makeTheme({
  types: {
    onlyAllowThemeValues: 'never',
    reactNativeTypesOnly: true
  },
  colors: {
    $primary: 'pink',
    $secondary: 'white'
  }
})

export type K2Theme = typeof theme
