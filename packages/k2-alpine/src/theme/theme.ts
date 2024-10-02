import { makeTheme } from 'dripsy'
import { darkModeColors, lightModeColors } from './tokens/colors'
import { text } from './tokens/text'

export const darkTheme = makeTheme({
  types: {
    onlyAllowThemeValues: 'always',
    reactNativeTypesOnly: true
  },
  colors: darkModeColors,
  text
})

export const lightTheme = {
  ...darkTheme,
  colors: lightModeColors
}

export type K2AlpineTheme = typeof darkTheme
