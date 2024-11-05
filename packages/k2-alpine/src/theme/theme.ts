import { makeTheme } from 'dripsy'
import { darkModeColors, lightModeColors } from './tokens/colors'
import { text } from './tokens/text'

export const darkTheme = makeTheme({
  types: {
    onlyAllowThemeValues: 'never',
    reactNativeTypesOnly: true
  },
  colors: darkModeColors,
  text,
  isDark: true as boolean
})

export const lightTheme = {
  ...darkTheme,
  colors: lightModeColors,
  isDark: false
}

export type K2AlpineTheme = typeof darkTheme
