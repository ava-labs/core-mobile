import { makeTheme, useDripsyTheme } from 'dripsy'
import { darkModeColors, lightModeColors } from './tokens/colors'
import { text } from './tokens/text'
import { styles } from './tokens/styles'

export const darkTheme = makeTheme({
  types: {
    onlyAllowThemeValues: 'never',
    reactNativeTypesOnly: true
  },
  colors: darkModeColors,
  text,
  styles
})

export const lightTheme = {
  ...darkTheme,
  colors: lightModeColors
}

export type K2AlpineTheme = typeof darkTheme

declare module 'dripsy' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DripsyCustomTheme extends K2AlpineTheme {}
}

export { useDripsyTheme as useTheme }