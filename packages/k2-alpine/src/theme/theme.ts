import { makeTheme } from 'dripsy'
import { darkModeColors, lightModeColors } from './tokens/colors'
import { text } from './tokens/text'
import { util } from './tokens/util'

export const theme = makeTheme({
  types: {
    onlyAllowThemeValues: 'never',
    reactNativeTypesOnly: true
  },
  colors: darkModeColors,
  text,
  util
})

export const lightTheme = {
  ...theme,
  colors: lightModeColors
}

export type K2AlpineTheme = typeof theme

declare module 'dripsy' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DripsyCustomTheme extends K2AlpineTheme {}
}
