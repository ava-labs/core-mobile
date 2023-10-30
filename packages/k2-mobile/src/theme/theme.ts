import { makeTheme } from 'dripsy'
import { colors } from './tokens/colors'
import { text } from './tokens/text'

export const theme = makeTheme({
  types: {
    onlyAllowThemeValues: 'never',
    reactNativeTypesOnly: true
  },
  colors,
  text
})

export type K2Theme = typeof theme
