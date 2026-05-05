import { makeTheme } from 'dripsy'
import {
  darkModeColors,
  lightModeColors,
  motoDarkModeColors,
  motoLightModeColors
} from './tokens/colors'
import { motoText, text } from './tokens/text'

export const darkTheme = makeTheme({
  types: {
    onlyAllowThemeValues: 'never',
    reactNativeTypesOnly: true
  },
  colors: darkModeColors,
  text,
  isDark: true as boolean,
  variant: 'default' as 'default' | 'moto'
})

export const lightTheme = {
  ...darkTheme,
  colors: lightModeColors,
  isDark: false
}

// Motorola "Hello UI" themes — same shape as default, different tokens. Swap
// these in via `K2AlpineThemeProvider variant="moto"` to flip the whole app's
// visual identity without touching individual screens. The `variant` flag
// lets components branch on Moto-specific styling (e.g. outline secondary
// buttons/chips per Hello UI spec) without inspecting raw color values.
export const motoDarkTheme = {
  ...darkTheme,
  colors: motoDarkModeColors,
  text: motoText,
  variant: 'moto' as const
}

export const motoLightTheme = {
  ...darkTheme,
  colors: motoLightModeColors,
  text: motoText,
  isDark: false,
  variant: 'moto' as const
}

export type K2AlpineTheme = typeof darkTheme

export type K2AlpineThemeVariant = 'default' | 'moto'
